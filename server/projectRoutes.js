const express = require('express');
const router = express.Router();
const Project = require('./models/Project');
const { isDBConnected } = require('./database');

// In-memory storage (fallback when database is not connected)
let projects = [];

// GET /api/projects - List all projects
router.get('/', async (req, res) => {
  try {
    const { phase, owner, sortBy = 'createdAt', order = 'desc' } = req.query;

    if (isDBConnected()) {
      // Database query
      const filter = {};
      if (phase) filter.phase = phase;
      if (owner) filter.owner = owner;

      const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

      const projectsFromDB = await Project.find(filter).sort(sort);

      return res.json({
        projects: projectsFromDB,
        total: projectsFromDB.length,
      });
    } else {
      // In-memory fallback
      let filteredProjects = [...projects];

      if (phase) {
        filteredProjects = filteredProjects.filter(p => p.phase === phase);
      }
      if (owner) {
        filteredProjects = filteredProjects.filter(p => p.owner === owner);
      }

      filteredProjects.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        return order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });

      res.json({
        projects: filteredProjects,
        total: filteredProjects.length,
      });
    }
  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// GET /api/projects/:id - Get single project by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const project = await Project.findOne({ projectId: id });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.json(project);
    } else {
      const project = projects.find(p => p.id === id || p.projectId === id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    }
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// POST /api/projects - Create new project
router.post('/', async (req, res) => {
  try {
    const { name, displayName, description = '', owner, tags = [], collaborators = [] } = req.body;

    // Validation
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required and must be a string' });
    }

    if (!displayName || typeof displayName !== 'string') {
      return res.status(400).json({ error: 'Display name is required and must be a string' });
    }

    if (!owner || typeof owner !== 'string') {
      return res.status(400).json({ error: 'Owner is required and must be a string' });
    }

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags must be an array' });
    }

    if (!Array.isArray(collaborators)) {
      return res.status(400).json({ error: 'Collaborators must be an array' });
    }

    const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (isDBConnected()) {
      const project = new Project({
        projectId,
        name,
        displayName,
        description,
        owner,
        phase: 'Active',
        tags,
        workflowCount: 0,
        collaborators,
      });

      await project.save();

      return res.status(201).json(project);
    } else {
      const project = {
        id: projectId,
        projectId,
        name,
        displayName,
        description,
        owner,
        phase: 'Active',
        tags,
        workflowCount: 0,
        collaborators,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      projects.push(project);
      res.status(201).json(project);
    }
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, description, tags, collaborators, workflowCount } = req.body;

    if (isDBConnected()) {
      const project = await Project.findOne({ projectId: id });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Update allowed fields
      if (displayName !== undefined) project.displayName = displayName;
      if (description !== undefined) project.description = description;
      if (tags !== undefined) project.tags = tags;
      if (collaborators !== undefined) project.collaborators = collaborators;
      if (workflowCount !== undefined) project.workflowCount = workflowCount;

      await project.save();

      return res.json(project);
    } else {
      const projectIndex = projects.findIndex(p => p.id === id || p.projectId === id);

      if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const project = projects[projectIndex];

      // Update allowed fields
      if (displayName !== undefined) project.displayName = displayName;
      if (description !== undefined) project.description = description;
      if (tags !== undefined) project.tags = tags;
      if (collaborators !== undefined) project.collaborators = collaborators;
      if (workflowCount !== undefined) project.workflowCount = workflowCount;
      project.updatedAt = new Date().toISOString();

      projects[projectIndex] = project;
      res.json(project);
    }
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Soft delete project (set phase to Terminating)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const project = await Project.findOne({ projectId: id });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      project.phase = 'Terminating';
      await project.save();

      return res.json({ message: 'Project marked for deletion', project });
    } else {
      const projectIndex = projects.findIndex(p => p.id === id || p.projectId === id);

      if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
      }

      projects[projectIndex].phase = 'Terminating';
      projects[projectIndex].updatedAt = new Date().toISOString();

      res.json({ message: 'Project marked for deletion', project: projects[projectIndex] });
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
