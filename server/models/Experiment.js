const mongoose = require('mongoose');

const ExperimentSchema = new mongoose.Schema(
  {
    experimentId: {
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
      enum: ['RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'RUNNING',
      index: true,
    },
    projectId: {
      type: String,
      index: true,
    },
    owner: {
      type: String,
      required: true,
      index: true,
    },
    framework: {
      type: String,
      default: 'unknown',
    },
    parameters: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metrics: {
      type: Map,
      of: Number,
      default: {},
    },
    artifacts: [
      {
        name: String,
        path: String,
        type: String,
        size: Number,
      },
    ],
    startTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate duration
ExperimentSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    this.duration = this.endTime - this.startTime;
  }
  next();
});

module.exports = mongoose.model('Experiment', ExperimentSchema);
