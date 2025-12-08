const express = require('express');
const router = express.Router();
const Experiment = require('./models/Experiment');
const { isDBConnected } = require('./database');
const { validate, experimentSchemas } = require('./validators');

// In-memory storage (fallback when database is not connected)
let experiments = [];

// GET /api/experiments - List all experiments
router.get('/', async (req, res) => {
  try {
    const { status, owner, sortBy = 'startTime', order = 'desc' } = req.query;

    if (isDBConnected()) {
      const filter = {};
      if (status) filter.status = status;
      if (owner) filter.owner = owner;

      const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
      const experimentsFromDB = await Experiment.find(filter).sort(sort);

      return res.json({
        experiments: experimentsFromDB,
        total: experimentsFromDB.length,
      });
    } else {
      let filteredExperiments = [...experiments];

      if (status) filteredExperiments = filteredExperiments.filter(e => e.status === status);
      if (owner) filteredExperiments = filteredExperiments.filter(e => e.owner === owner);

      filteredExperiments.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        return order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });

      res.json({
        experiments: filteredExperiments,
        total: filteredExperiments.length,
      });
    }
  } catch (error) {
    console.error('Error listing experiments:', error);
    res.status(500).json({ error: 'Failed to list experiments' });
  }
});

// GET /api/experiments/:id - Get single experiment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const experiment = await Experiment.findOne({ experimentId: id });

      if (!experiment) {
        return res.status(404).json({ error: 'Experiment not found' });
      }

      return res.json(experiment);
    } else {
      const experiment = experiments.find(e => e.experimentId === id);

      if (!experiment) {
        return res.status(404).json({ error: 'Experiment not found' });
      }

      res.json(experiment);
    }
  } catch (error) {
    console.error('Error getting experiment:', error);
    res.status(500).json({ error: 'Failed to get experiment' });
  }
});

// POST /api/experiments - Create new experiment
router.post('/', validate(experimentSchemas.create), async (req, res) => {
  try {
    const {
      name,
      description = '',
      owner,
      framework = 'unknown',
      parameters = {},
      metrics = {},
      projectId,
      tags = [],
    } = req.body;

    if (!name || !owner) {
      return res.status(400).json({ error: 'Name and owner are required' });
    }

    const experimentId = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (isDBConnected()) {
      const experiment = new Experiment({
        experimentId,
        name,
        description,
        owner,
        framework,
        parameters,
        metrics,
        projectId,
        tags,
        status: 'RUNNING',
        startTime: new Date(),
      });

      await experiment.save();
      return res.status(201).json(experiment);
    } else {
      const experiment = {
        experimentId,
        name,
        description,
        owner,
        framework,
        parameters,
        metrics,
        projectId,
        tags,
        status: 'RUNNING',
        startTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      experiments.push(experiment);
      res.status(201).json(experiment);
    }
  } catch (error) {
    console.error('Error creating experiment:', error);
    res.status(500).json({ error: 'Failed to create experiment' });
  }
});

// PATCH /api/experiments/:id/status - Update experiment status
router.patch('/:id/status', validate(experimentSchemas.update), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    if (isDBConnected()) {
      const experiment = await Experiment.findOne({ experimentId: id });

      if (!experiment) {
        return res.status(404).json({ error: 'Experiment not found' });
      }

      experiment.status = status;
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
        experiment.endTime = new Date();
      }

      await experiment.save();
      return res.json(experiment);
    } else {
      const experimentIndex = experiments.findIndex(e => e.experimentId === id);

      if (experimentIndex === -1) {
        return res.status(404).json({ error: 'Experiment not found' });
      }

      experiments[experimentIndex].status = status;
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
        experiments[experimentIndex].endTime = new Date().toISOString();
      }
      experiments[experimentIndex].updatedAt = new Date().toISOString();

      res.json(experiments[experimentIndex]);
    }
  } catch (error) {
    console.error('Error updating experiment status:', error);
    res.status(500).json({ error: 'Failed to update experiment status' });
  }
});

// DELETE /api/experiments/:id - Delete experiment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const experiment = await Experiment.findOneAndDelete({ experimentId: id });

      if (!experiment) {
        return res.status(404).json({ error: 'Experiment not found' });
      }

      return res.json({ message: 'Experiment deleted successfully' });
    } else {
      const experimentIndex = experiments.findIndex(e => e.experimentId === id);

      if (experimentIndex === -1) {
        return res.status(404).json({ error: 'Experiment not found' });
      }

      experiments.splice(experimentIndex, 1);
      res.json({ message: 'Experiment deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting experiment:', error);
    res.status(500).json({ error: 'Failed to delete experiment' });
  }
});

module.exports = router;
