const express = require('express');
const router = express.Router();
const Notebook = require('./models/Notebook');
const { isDBConnected } = require('./database');

let notebooks = [];

router.get('/', async (req, res) => {
  try {
    const { status, owner, sortBy = 'lastActivity', order = 'desc' } = req.query;

    if (isDBConnected()) {
      const filter = {};
      if (status) filter.status = status;
      if (owner) filter.owner = owner;

      const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
      const notebooksFromDB = await Notebook.find(filter).sort(sort);

      return res.json({
        notebooks: notebooksFromDB,
        total: notebooksFromDB.length,
      });
    } else {
      let filteredNotebooks = [...notebooks];

      if (status) filteredNotebooks = filteredNotebooks.filter(n => n.status === status);
      if (owner) filteredNotebooks = filteredNotebooks.filter(n => n.owner === owner);

      res.json({
        notebooks: filteredNotebooks,
        total: filteredNotebooks.length,
      });
    }
  } catch (error) {
    console.error('Error listing notebooks:', error);
    res.status(500).json({ error: 'Failed to list notebooks' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      description = '',
      owner,
      image,
      size = 'Small',
      gpus = 0,
      projectId,
      storageSize = '10Gi',
    } = req.body;

    if (!name || !owner || !image) {
      return res.status(400).json({ error: 'Name, owner, and image are required' });
    }

    const notebookId = `nb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (isDBConnected()) {
      const notebook = new Notebook({
        notebookId,
        name,
        description,
        owner,
        image,
        size,
        gpus,
        projectId,
        storageSize,
        status: 'STARTING',
      });

      await notebook.save();
      return res.status(201).json(notebook);
    } else {
      const notebook = {
        notebookId,
        name,
        description,
        owner,
        image,
        size,
        gpus,
        projectId,
        storageSize,
        status: 'STARTING',
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      notebooks.push(notebook);
      res.status(201).json(notebook);
    }
  } catch (error) {
    console.error('Error creating notebook:', error);
    res.status(500).json({ error: 'Failed to create notebook' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['RUNNING', 'STOPPED', 'STARTING', 'STOPPING', 'ERROR'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    if (isDBConnected()) {
      const notebook = await Notebook.findOne({ notebookId: id });

      if (!notebook) {
        return res.status(404).json({ error: 'Notebook not found' });
      }

      notebook.status = status;
      notebook.lastActivity = new Date();

      await notebook.save();
      return res.json(notebook);
    } else {
      const notebookIndex = notebooks.findIndex(n => n.notebookId === id);

      if (notebookIndex === -1) {
        return res.status(404).json({ error: 'Notebook not found' });
      }

      notebooks[notebookIndex].status = status;
      notebooks[notebookIndex].lastActivity = new Date().toISOString();
      notebooks[notebookIndex].updatedAt = new Date().toISOString();

      res.json(notebooks[notebookIndex]);
    }
  } catch (error) {
    console.error('Error updating notebook status:', error);
    res.status(500).json({ error: 'Failed to update notebook status' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const notebook = await Notebook.findOneAndDelete({ notebookId: id });

      if (!notebook) {
        return res.status(404).json({ error: 'Notebook not found' });
      }

      return res.json({ message: 'Notebook deleted successfully' });
    } else {
      const notebookIndex = notebooks.findIndex(n => n.notebookId === id);

      if (notebookIndex === -1) {
        return res.status(404).json({ error: 'Notebook not found' });
      }

      notebooks.splice(notebookIndex, 1);
      res.json({ message: 'Notebook deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting notebook:', error);
    res.status(500).json({ error: 'Failed to delete notebook' });
  }
});

module.exports = router;
