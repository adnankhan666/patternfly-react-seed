const express = require('express');
const router = express.Router();
const User = require('./models/User');
const { generateToken } = require('./utils/jwt');
const { authMiddleware } = require('./middleware/auth');
const { isDBConnected } = require('./database');

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName, role } = req.body;

    // Validation
    if (!username || !email || !password || !displayName) {
      return res.status(400).json({
        error: 'Username, email, password, and displayName are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    if (isDBConnected()) {
      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Username or email already exists'
        });
      }

      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const user = new User({
        userId,
        username,
        email,
        password, // Will be hashed by pre-save hook
        displayName,
        role: role || 'EDITOR',
      });

      await user.save();

      const token = generateToken({ userId: user.userId, role: user.role });

      return res.status(201).json({
        user: user.toJSON(),
        token,
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours
      });
    } else {
      // In-memory fallback
      return res.status(503).json({
        error: 'Database unavailable. Registration requires database connection.'
      });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    if (isDBConnected()) {
      // Find user and include password field
      const user = await User.findOne({ username }).select('+password');

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = generateToken({ userId: user.userId, role: user.role });

      return res.json({
        user: user.toJSON(),
        token,
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours
      });
    } else {
      return res.status(503).json({
        error: 'Database unavailable. Login requires database connection.'
      });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Protected route - requires valid JWT token
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (isDBConnected()) {
      const user = await User.findOne({ userId: req.user.userId });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } else {
      return res.status(503).json({ error: 'Database unavailable' });
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * PUT /api/auth/me
 * Update current authenticated user profile
 * Protected route - requires valid JWT token
 */
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { displayName, avatar, preferences } = req.body;

    if (isDBConnected()) {
      const user = await User.findOne({ userId: req.user.userId });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update allowed fields
      if (displayName) user.displayName = displayName;
      if (avatar !== undefined) user.avatar = avatar;
      if (preferences) {
        user.preferences = {
          ...user.preferences.toObject(),
          ...preferences,
        };
      }

      await user.save();

      res.json(user);
    } else {
      return res.status(503).json({ error: 'Database unavailable' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 * This is a placeholder for client-side token removal
 */
router.post('/logout', authMiddleware, (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  // This endpoint can be used for logging or analytics
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
