const express = require('express');
const router = express.Router();
const RegisteredModel = require('./models/RegisteredModel');
const { isDBConnected } = require('./database');
const { validate, modelSchemas } = require('./validators');

// In-memory storage (fallback when database is not connected)
let models = [];

// GET /api/models - List all registered models
router.get('/', async (req, res) => {
  try {
    const { state, owner, sortBy = 'createdAt', order = 'desc' } = req.query;

    if (isDBConnected()) {
      // Database query
      const filter = {};
      if (state) filter.state = state;
      if (owner) filter.owner = owner;

      const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

      const modelsFromDB = await RegisteredModel.find(filter).sort(sort);

      return res.json({
        models: modelsFromDB,
        total: modelsFromDB.length,
      });
    } else {
      // In-memory fallback
      let filteredModels = [...models];

      if (state) {
        filteredModels = filteredModels.filter(m => m.state === state);
      }
      if (owner) {
        filteredModels = filteredModels.filter(m => m.owner === owner);
      }

      filteredModels.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        return order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });

      res.json({
        models: filteredModels,
        total: filteredModels.length,
      });
    }
  } catch (error) {
    console.error('Error listing models:', error);
    res.status(500).json({ error: 'Failed to list models' });
  }
});

// GET /api/models/:id - Get single model by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const model = await RegisteredModel.findOne({ modelId: id });

      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }

      return res.json(model);
    } else {
      const model = models.find(m => m.id === id || m.modelId === id);

      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }

      res.json(model);
    }
  } catch (error) {
    console.error('Error getting model:', error);
    res.status(500).json({ error: 'Failed to get model' });
  }
});

// POST /api/models - Register new model
router.post('/', validate(modelSchemas.create), async (req, res) => {
  try {
    const { name, owner, state = 'LIVE', description = '', customProperties = {}, externalID = '' } = req.body;

    const modelId = `model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (isDBConnected()) {
      const model = new RegisteredModel({
        modelId,
        name,
        owner,
        state,
        description,
        customProperties,
        externalID,
      });

      await model.save();

      return res.status(201).json(model);
    } else {
      const model = {
        id: modelId,
        modelId,
        name,
        owner,
        state,
        description,
        customProperties,
        externalID,
        createTimeSinceEpoch: Date.now().toString(),
        lastUpdateTimeSinceEpoch: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      models.push(model);
      res.status(201).json(model);
    }
  } catch (error) {
    console.error('Error creating model:', error);
    res.status(500).json({ error: 'Failed to create model' });
  }
});

// PUT /api/models/:id - Update model
router.put('/:id', validate(modelSchemas.update), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, customProperties, externalID } = req.body;

    if (isDBConnected()) {
      const model = await RegisteredModel.findOne({ modelId: id });

      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }

      // Update allowed fields
      if (name !== undefined) model.name = name;
      if (description !== undefined) model.description = description;
      if (customProperties !== undefined) model.customProperties = customProperties;
      if (externalID !== undefined) model.externalID = externalID;

      await model.save();

      return res.json(model);
    } else {
      const modelIndex = models.findIndex(m => m.id === id || m.modelId === id);

      if (modelIndex === -1) {
        return res.status(404).json({ error: 'Model not found' });
      }

      const model = models[modelIndex];

      // Update allowed fields
      if (name !== undefined) model.name = name;
      if (description !== undefined) model.description = description;
      if (customProperties !== undefined) model.customProperties = customProperties;
      if (externalID !== undefined) model.externalID = externalID;
      model.lastUpdateTimeSinceEpoch = Date.now().toString();
      model.updatedAt = new Date().toISOString();

      models[modelIndex] = model;
      res.json(model);
    }
  } catch (error) {
    console.error('Error updating model:', error);
    res.status(500).json({ error: 'Failed to update model' });
  }
});

// PATCH /api/models/:id/state - Change model state (LIVE/ARCHIVED)
router.patch('/:id/state', async (req, res) => {
  try {
    const { id } = req.params;
    const { state } = req.body;

    // Validation
    const validStates = ['LIVE', 'ARCHIVED', 'UNKNOWN'];
    if (!state || !validStates.includes(state)) {
      return res.status(400).json({ error: `State must be one of: ${validStates.join(', ')}` });
    }

    if (isDBConnected()) {
      const model = await RegisteredModel.findOne({ modelId: id });

      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }

      model.state = state;
      await model.save();

      return res.json(model);
    } else {
      const modelIndex = models.findIndex(m => m.id === id || m.modelId === id);

      if (modelIndex === -1) {
        return res.status(404).json({ error: 'Model not found' });
      }

      models[modelIndex].state = state;
      models[modelIndex].lastUpdateTimeSinceEpoch = Date.now().toString();
      models[modelIndex].updatedAt = new Date().toISOString();

      res.json(models[modelIndex]);
    }
  } catch (error) {
    console.error('Error updating model state:', error);
    res.status(500).json({ error: 'Failed to update model state' });
  }
});

// DELETE /api/models/:id - Delete model
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const model = await RegisteredModel.findOneAndDelete({ modelId: id });

      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }

      return res.json({ message: 'Model deleted successfully' });
    } else {
      const modelIndex = models.findIndex(m => m.id === id || m.modelId === id);

      if (modelIndex === -1) {
        return res.status(404).json({ error: 'Model not found' });
      }

      models.splice(modelIndex, 1);
      res.json({ message: 'Model deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

module.exports = router;
