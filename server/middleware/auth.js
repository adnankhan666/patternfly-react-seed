const { verifyToken } = require('../utils/jwt');

/**
 * Authentication middleware - protects routes by verifying JWT token
 *
 * Extracts token from Authorization header, verifies it, and attaches
 * decoded user data to req.user for use in route handlers.
 *
 * Usage: Add this middleware to routes that require authentication
 * Example: router.get('/protected', authMiddleware, handler)
 */
const authMiddleware = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Role-based authorization middleware
 *
 * Checks if authenticated user has one of the required roles.
 * Must be used after authMiddleware.
 *
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware function
 *
 * Usage: router.delete('/admin-only', authMiddleware, requireRole(['ADMIN']), handler)
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole,
};
