const express = require('express');
const router = express.Router();
const Workflow = require('./models/Workflow');
const { isDBConnected } = require('./database');

// In-memory storage (fallback when database is not connected)
let workflows = [];
let workflowIdCounter = 1;

// GET /api/workflows - List all workflows
router.get('/', async (req, res) => {
  try {
    const { status, sortBy = 'updatedAt', order = 'desc' } = req.query;

    if (isDBConnected()) {
      // Database query
      const filter = status ? { status } : {};
      const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

      const workflowsFromDB = await Workflow.find(filter).sort(sort);

      return res.json({
        workflows: workflowsFromDB,
        total: workflowsFromDB.length,
      });
    } else {
      // In-memory fallback
      let filteredWorkflows = [...workflows];

      if (status) {
        filteredWorkflows = filteredWorkflows.filter(w => w.status === status);
      }

      filteredWorkflows.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        return order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });

      res.json({
        workflows: filteredWorkflows,
        total: filteredWorkflows.length,
      });
    }
  } catch (error) {
    console.error('Error listing workflows:', error);
    res.status(500).json({ error: 'Failed to list workflows' });
  }
});

// GET /api/workflows/:id - Get single workflow by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const workflow = await Workflow.findOne({ workflowId: id });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      return res.json(workflow);
    } else {
      const workflow = workflows.find(w => w.id === id);

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      res.json(workflow);
    }
  } catch (error) {
    console.error('Error getting workflow:', error);
    res.status(500).json({ error: 'Failed to get workflow' });
  }
});

// POST /api/workflows - Create new workflow
router.post('/', async (req, res) => {
  try {
    const { name, description, nodes = [], connections = [], metadata = {} } = req.body;

    // Validation
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required and must be a string' });
    }

    if (!Array.isArray(nodes)) {
      return res.status(400).json({ error: 'Nodes must be an array' });
    }

    if (!Array.isArray(connections)) {
      return res.status(400).json({ error: 'Connections must be an array' });
    }

    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const createdBy = req.headers['x-user-id'] || 'anonymous';

    if (isDBConnected()) {
      // Create in database
      const workflow = new Workflow({
        workflowId,
        name,
        description: description || '',
        nodes,
        connections,
        metadata,
        status: 'draft',
        version: 1,
        createdBy,
        lastExecutedAt: null,
        executionCount: 0,
      });

      await workflow.save();

      return res.status(201).json(workflow);
    } else {
      // In-memory fallback
      const workflow = {
        id: `workflow-${workflowIdCounter++}`,
        name,
        description: description || '',
        nodes,
        connections,
        metadata,
        status: 'draft',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy,
        lastExecutedAt: null,
        executionCount: 0,
      };

      workflows.push(workflow);

      res.status(201).json(workflow);
    }
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// PUT /api/workflows/:id - Update existing workflow
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, nodes, connections, metadata, status } = req.body;

    if (isDBConnected()) {
      const workflow = await Workflow.findOne({ workflowId: id });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // Update fields
      if (name !== undefined) workflow.name = name;
      if (description !== undefined) workflow.description = description;
      if (nodes !== undefined) workflow.nodes = nodes;
      if (connections !== undefined) workflow.connections = connections;
      if (metadata !== undefined) workflow.metadata = { ...workflow.metadata, ...metadata };
      if (status !== undefined) workflow.status = status;

      workflow.version += 1;

      await workflow.save();

      return res.json(workflow);
    } else {
      const workflowIndex = workflows.findIndex(w => w.id === id);

      if (workflowIndex === -1) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const existingWorkflow = workflows[workflowIndex];

      const updatedWorkflow = {
        ...existingWorkflow,
        name: name !== undefined ? name : existingWorkflow.name,
        description: description !== undefined ? description : existingWorkflow.description,
        nodes: nodes !== undefined ? nodes : existingWorkflow.nodes,
        connections: connections !== undefined ? connections : existingWorkflow.connections,
        metadata: metadata !== undefined ? { ...existingWorkflow.metadata, ...metadata } : existingWorkflow.metadata,
        status: status !== undefined ? status : existingWorkflow.status,
        version: existingWorkflow.version + 1,
        updatedAt: new Date().toISOString(),
      };

      workflows[workflowIndex] = updatedWorkflow;

      res.json(updatedWorkflow);
    }
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// PATCH /api/workflows/:id/execute - Mark workflow as executed
router.patch('/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const workflow = await Workflow.findOne({ workflowId: id });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      workflow.lastExecutedAt = new Date();
      workflow.executionCount = (workflow.executionCount || 0) + 1;

      await workflow.save();

      return res.json(workflow);
    } else {
      const workflowIndex = workflows.findIndex(w => w.id === id);

      if (workflowIndex === -1) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const workflow = workflows[workflowIndex];

      workflow.lastExecutedAt = new Date().toISOString();
      workflow.executionCount = (workflow.executionCount || 0) + 1;
      workflow.updatedAt = new Date().toISOString();

      res.json(workflow);
    }
  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
});

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const workflow = await Workflow.findOneAndDelete({ workflowId: id });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      return res.json({
        message: 'Workflow deleted successfully',
        workflow,
      });
    } else {
      const workflowIndex = workflows.findIndex(w => w.id === id);

      if (workflowIndex === -1) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const deletedWorkflow = workflows.splice(workflowIndex, 1)[0];

      res.json({
        message: 'Workflow deleted successfully',
        workflow: deletedWorkflow,
      });
    }
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// POST /api/workflows/:id/duplicate - Duplicate workflow
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const workflow = await Workflow.findOne({ workflowId: id });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const duplicateId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const duplicate = new Workflow({
        workflowId: duplicateId,
        name: `${workflow.name} (Copy)`,
        description: workflow.description,
        nodes: workflow.nodes,
        connections: workflow.connections,
        metadata: workflow.metadata,
        status: 'draft',
        version: 1,
        createdBy: req.headers['x-user-id'] || 'anonymous',
        lastExecutedAt: null,
        executionCount: 0,
      });

      await duplicate.save();

      return res.status(201).json(duplicate);
    } else {
      const workflow = workflows.find(w => w.id === id);

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const duplicate = {
        ...workflow,
        id: `workflow-${workflowIdCounter++}`,
        name: `${workflow.name} (Copy)`,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.headers['x-user-id'] || 'anonymous',
        lastExecutedAt: null,
        executionCount: 0,
      };

      workflows.push(duplicate);

      res.status(201).json(duplicate);
    }
  } catch (error) {
    console.error('Error duplicating workflow:', error);
    res.status(500).json({ error: 'Failed to duplicate workflow' });
  }
});

// GET /api/workflows/:id/versions - Get workflow version history (placeholder)
router.get('/:id/versions', (req, res) => {
  try {
    const { id } = req.params;
    const workflow = workflows.find(w => w.id === id);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // For now, return current version only
    // In database implementation, this will return full version history
    res.json({
      versions: [{
        version: workflow.version,
        updatedAt: workflow.updatedAt,
        createdBy: workflow.createdBy,
      }],
    });
  } catch (error) {
    console.error('Error getting workflow versions:', error);
    res.status(500).json({ error: 'Failed to get workflow versions' });
  }
});

module.exports = router;
