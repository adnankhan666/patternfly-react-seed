const express = require('express');
const router = express.Router();
const Execution = require('./models/Execution');
const { isDBConnected } = require('./database');

// In-memory storage (fallback when database is not connected)
let executions = [];

// GET /api/executions - List all executions
router.get('/', async (req, res) => {
  try {
    const { status, workflowId, triggeredBy, sortBy = 'startTime', order = 'desc' } = req.query;

    if (isDBConnected()) {
      // Database query
      const filter = {};
      if (status) filter.status = status;
      if (workflowId) filter.workflowId = workflowId;
      if (triggeredBy) filter.triggeredBy = triggeredBy;

      const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

      const executionsFromDB = await Execution.find(filter).sort(sort);

      return res.json({
        executions: executionsFromDB,
        total: executionsFromDB.length,
      });
    } else {
      // In-memory fallback
      let filteredExecutions = [...executions];

      if (status) {
        filteredExecutions = filteredExecutions.filter(e => e.status === status);
      }
      if (workflowId) {
        filteredExecutions = filteredExecutions.filter(e => e.workflowId === workflowId);
      }
      if (triggeredBy) {
        filteredExecutions = filteredExecutions.filter(e => e.triggeredBy === triggeredBy);
      }

      filteredExecutions.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        return order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });

      res.json({
        executions: filteredExecutions,
        total: filteredExecutions.length,
      });
    }
  } catch (error) {
    console.error('Error listing executions:', error);
    res.status(500).json({ error: 'Failed to list executions' });
  }
});

// GET /api/executions/:id - Get single execution by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const execution = await Execution.findOne({ executionId: id });

      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      return res.json(execution);
    } else {
      const execution = executions.find(e => e.id === id || e.executionId === id);

      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      res.json(execution);
    }
  } catch (error) {
    console.error('Error getting execution:', error);
    res.status(500).json({ error: 'Failed to get execution' });
  }
});

// GET /api/executions/workflow/:workflowId - Get execution history for workflow
router.get('/workflow/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { limit = 50 } = req.query;

    if (isDBConnected()) {
      const executionsFromDB = await Execution.find({ workflowId })
        .sort({ startTime: -1 })
        .limit(parseInt(limit));

      return res.json({
        executions: executionsFromDB,
        total: executionsFromDB.length,
      });
    } else {
      const filteredExecutions = executions
        .filter(e => e.workflowId === workflowId)
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, parseInt(limit));

      res.json({
        executions: filteredExecutions,
        total: filteredExecutions.length,
      });
    }
  } catch (error) {
    console.error('Error getting workflow executions:', error);
    res.status(500).json({ error: 'Failed to get workflow executions' });
  }
});

// POST /api/executions - Create new execution (trigger workflow)
router.post('/', async (req, res) => {
  try {
    const { workflowId, workflowName, triggeredBy, steps = [] } = req.body;

    // Validation
    if (!workflowId || typeof workflowId !== 'string') {
      return res.status(400).json({ error: 'Workflow ID is required and must be a string' });
    }

    if (!workflowName || typeof workflowName !== 'string') {
      return res.status(400).json({ error: 'Workflow name is required and must be a string' });
    }

    if (!triggeredBy || typeof triggeredBy !== 'string') {
      return res.status(400).json({ error: 'Triggered by is required and must be a string' });
    }

    if (!Array.isArray(steps)) {
      return res.status(400).json({ error: 'Steps must be an array' });
    }

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (isDBConnected()) {
      const execution = new Execution({
        executionId,
        workflowId,
        workflowName,
        status: 'PENDING',
        startTime: new Date(),
        triggeredBy,
        steps,
      });

      await execution.save();

      return res.status(201).json(execution);
    } else {
      const execution = {
        id: executionId,
        executionId,
        workflowId,
        workflowName,
        status: 'PENDING',
        startTime: new Date().toISOString(),
        endTime: null,
        duration: null,
        triggeredBy,
        steps,
        totalNodes: steps.length,
        completedNodes: 0,
        failedNodes: 0,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      executions.push(execution);
      res.status(201).json(execution);
    }
  } catch (error) {
    console.error('Error creating execution:', error);
    res.status(500).json({ error: 'Failed to create execution' });
  }
});

// PATCH /api/executions/:id/status - Update execution status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, steps, endTime } = req.body;

    // Validation
    const validStatuses = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    if (isDBConnected()) {
      const execution = await Execution.findOne({ executionId: id });

      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      // Update fields
      if (status) execution.status = status;
      if (steps) execution.steps = steps;
      if (endTime) execution.endTime = new Date(endTime);

      await execution.save();

      return res.json(execution);
    } else {
      const executionIndex = executions.findIndex(e => e.id === id || e.executionId === id);

      if (executionIndex === -1) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      const execution = executions[executionIndex];

      // Update fields
      if (status) execution.status = status;
      if (steps) {
        execution.steps = steps;
        execution.totalNodes = steps.length;
        execution.completedNodes = steps.filter(s => s.status === 'COMPLETED').length;
        execution.failedNodes = steps.filter(s => s.status === 'FAILED').length;
        execution.progress = execution.totalNodes > 0
          ? Math.round((execution.completedNodes / execution.totalNodes) * 100)
          : 0;
      }
      if (endTime) {
        execution.endTime = endTime;
        execution.duration = new Date(endTime) - new Date(execution.startTime);
      }
      execution.updatedAt = new Date().toISOString();

      executions[executionIndex] = execution;
      res.json(execution);
    }
  } catch (error) {
    console.error('Error updating execution status:', error);
    res.status(500).json({ error: 'Failed to update execution status' });
  }
});

// DELETE /api/executions/:id - Delete execution
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const execution = await Execution.findOneAndDelete({ executionId: id });

      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      return res.json({ message: 'Execution deleted successfully' });
    } else {
      const executionIndex = executions.findIndex(e => e.id === id || e.executionId === id);

      if (executionIndex === -1) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      executions.splice(executionIndex, 1);
      res.json({ message: 'Execution deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting execution:', error);
    res.status(500).json({ error: 'Failed to delete execution' });
  }
});

module.exports = router;
