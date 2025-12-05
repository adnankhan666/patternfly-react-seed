const mongoose = require('mongoose');

const TrainingJobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    framework: {
      type: String,
      required: true,
    },
    modelType: {
      type: String,
      default: '',
    },
    owner: {
      type: String,
      required: true,
      index: true,
    },
    projectId: {
      type: String,
      index: true,
    },
    datasetPath: {
      type: String,
      default: '',
    },
    hyperparameters: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    resources: {
      cpus: { type: Number, default: 2 },
      memory: { type: String, default: '4Gi' },
      gpus: { type: Number, default: 0 },
    },
    metrics: {
      accuracy: Number,
      loss: Number,
      epoch: Number,
      trainingTime: Number,
    },
    startTime: {
      type: Date,
      index: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
    },
    outputModelPath: {
      type: String,
      default: '',
    },
    logs: [
      {
        timestamp: Date,
        message: String,
        level: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate duration
TrainingJobSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    this.duration = this.endTime - this.startTime;
  }
  next();
});

module.exports = mongoose.model('TrainingJob', TrainingJobSchema);
