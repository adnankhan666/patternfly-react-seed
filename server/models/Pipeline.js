const mongoose = require('mongoose');

const PipelineSchema = new mongoose.Schema(
  {
    pipelineId: {
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
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
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
    steps: [
      {
        stepId: String,
        name: String,
        type: String,
        image: String,
        command: [String],
        inputs: Map,
        outputs: Map,
        dependencies: [String],
      },
    ],
    schedule: {
      enabled: { type: Boolean, default: false },
      cron: String,
      timezone: { type: String, default: 'UTC' },
    },
    lastRunTime: {
      type: Date,
    },
    nextRunTime: {
      type: Date,
    },
    runsCount: {
      type: Number,
      default: 0,
    },
    successRate: {
      type: Number,
      default: 0,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Pipeline', PipelineSchema);
