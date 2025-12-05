const express = require('express');
const router = express.Router();
const Pipeline = require('./models/Pipeline');
const { isDBConnected } = require('./database');

let pipelines = [];

router.get('/', async (req, res) => {
  try {
    const { status, owner, sortBy = 'updatedAt', order = 'desc' } = req.query;

    if (isDBConnected()) {
      const filter = {};
      if (status) filter.status = status;
      if (owner) filter.owner = owner;

      const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
      const pipelinesFromDB = await Pipeline.find(filter).sort(sort);

      return res.json({
        pipelines: pipelinesFromDB,
        total: pipelinesFromDB.length,
      });
    } else {
      let filteredPipelines = [...pipelines];

      if (status) filteredPipelines = filteredPipelines.filter(p => p.status === status);
      if (owner) filteredPipelines = filteredPipelines.filter(p => p.owner === owner);

      res.json({
        pipelines: filteredPipelines,
        total: filteredPipelines.length,
      });
    }
  } catch (error) {
    console.error('Error listing pipelines:', error);
    res.status(500).json({ error: 'Failed to list pipelines' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      description = '',
      owner,
      projectId,
      steps = [],
      schedule = { enabled: false },
      tags = [],
    } = req.body;

    if (!name || !owner) {
      return res.status(400).json({ error: 'Name and owner are required' });
    }

    const pipelineId = `pipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (isDBConnected()) {
      const pipeline = new Pipeline({
        pipelineId,
        name,
        description,
        owner,
        projectId,
        steps,
        schedule,
        tags,
        status: 'DRAFT',
        version: 1,
      });

      await pipeline.save();
      return res.status(201).json(pipeline);
    } else {
      const pipeline = {
        pipelineId,
        name,
        description,
        owner,
        projectId,
        steps,
        schedule,
        tags,
        status: 'DRAFT',
        version: 1,
        runsCount: 0,
        successRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      pipelines.push(pipeline);
      res.status(201).json(pipeline);
    }
  } catch (error) {
    console.error('Error creating pipeline:', error);
    res.status(500).json({ error: 'Failed to create pipeline' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['DRAFT', 'ACTIVE', 'ARCHIVED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    if (isDBConnected()) {
      const pipeline = await Pipeline.findOne({ pipelineId: id });

      if (!pipeline) {
        return res.status(404).json({ error: 'Pipeline not found' });
      }

      pipeline.status = status;
      await pipeline.save();
      return res.json(pipeline);
    } else {
      const pipelineIndex = pipelines.findIndex(p => p.pipelineId === id);

      if (pipelineIndex === -1) {
        return res.status(404).json({ error: 'Pipeline not found' });
      }

      pipelines[pipelineIndex].status = status;
      pipelines[pipelineIndex].updatedAt = new Date().toISOString();

      res.json(pipelines[pipelineIndex]);
    }
  } catch (error) {
    console.error('Error updating pipeline status:', error);
    res.status(500).json({ error: 'Failed to update pipeline status' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const pipeline = await Pipeline.findOneAndDelete({ pipelineId: id });

      if (!pipeline) {
        return res.status(404).json({ error: 'Pipeline not found' });
      }

      return res.json({ message: 'Pipeline deleted successfully' });
    } else {
      const pipelineIndex = pipelines.findIndex(p => p.pipelineId === id);

      if (pipelineIndex === -1) {
        return res.status(404).json({ error: 'Pipeline not found' });
      }

      pipelines.splice(pipelineIndex, 1);
      res.json({ message: 'Pipeline deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    res.status(500).json({ error: 'Failed to delete pipeline' });
  }
});

module.exports = router;
