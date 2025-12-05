const express = require('express');
const router = express.Router();
const TrainingJob = require('./models/TrainingJob');
const { isDBConnected } = require('./database');

let trainingJobs = [];

router.get('/', async (req, res) => {
  try {
    const { status, owner, sortBy = 'startTime', order = 'desc' } = req.query;

    if (isDBConnected()) {
      const filter = {};
      if (status) filter.status = status;
      if (owner) filter.owner = owner;

      const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
      const jobsFromDB = await TrainingJob.find(filter).sort(sort);

      return res.json({
        trainingJobs: jobsFromDB,
        total: jobsFromDB.length,
      });
    } else {
      let filteredJobs = [...trainingJobs];

      if (status) filteredJobs = filteredJobs.filter(j => j.status === status);
      if (owner) filteredJobs = filteredJobs.filter(j => j.owner === owner);

      res.json({
        trainingJobs: filteredJobs,
        total: filteredJobs.length,
      });
    }
  } catch (error) {
    console.error('Error listing training jobs:', error);
    res.status(500).json({ error: 'Failed to list training jobs' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      description = '',
      owner,
      framework,
      modelType = '',
      projectId,
      datasetPath = '',
      hyperparameters = {},
      resources = { cpus: 2, memory: '4Gi', gpus: 0 },
    } = req.body;

    if (!name || !owner || !framework) {
      return res.status(400).json({ error: 'Name, owner, and framework are required' });
    }

    const jobId = `train-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (isDBConnected()) {
      const job = new TrainingJob({
        jobId,
        name,
        description,
        owner,
        framework,
        modelType,
        projectId,
        datasetPath,
        hyperparameters,
        resources,
        status: 'PENDING',
      });

      await job.save();
      return res.status(201).json(job);
    } else {
      const job = {
        jobId,
        name,
        description,
        owner,
        framework,
        modelType,
        projectId,
        datasetPath,
        hyperparameters,
        resources,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      trainingJobs.push(job);
      res.status(201).json(job);
    }
  } catch (error) {
    console.error('Error creating training job:', error);
    res.status(500).json({ error: 'Failed to create training job' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    if (isDBConnected()) {
      const job = await TrainingJob.findOne({ jobId: id });

      if (!job) {
        return res.status(404).json({ error: 'Training job not found' });
      }

      job.status = status;
      if (status === 'RUNNING' && !job.startTime) {
        job.startTime = new Date();
      }
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
        job.endTime = new Date();
      }

      await job.save();
      return res.json(job);
    } else {
      const jobIndex = trainingJobs.findIndex(j => j.jobId === id);

      if (jobIndex === -1) {
        return res.status(404).json({ error: 'Training job not found' });
      }

      trainingJobs[jobIndex].status = status;
      if (status === 'RUNNING' && !trainingJobs[jobIndex].startTime) {
        trainingJobs[jobIndex].startTime = new Date().toISOString();
      }
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
        trainingJobs[jobIndex].endTime = new Date().toISOString();
      }
      trainingJobs[jobIndex].updatedAt = new Date().toISOString();

      res.json(trainingJobs[jobIndex]);
    }
  } catch (error) {
    console.error('Error updating training job status:', error);
    res.status(500).json({ error: 'Failed to update training job status' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDBConnected()) {
      const job = await TrainingJob.findOneAndDelete({ jobId: id });

      if (!job) {
        return res.status(404).json({ error: 'Training job not found' });
      }

      return res.json({ message: 'Training job deleted successfully' });
    } else {
      const jobIndex = trainingJobs.findIndex(j => j.jobId === id);

      if (jobIndex === -1) {
        return res.status(404).json({ error: 'Training job not found' });
      }

      trainingJobs.splice(jobIndex, 1);
      res.json({ message: 'Training job deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting training job:', error);
    res.status(500).json({ error: 'Failed to delete training job' });
  }
});

module.exports = router;
