const mongoose = require('mongoose');

// Nested schema for execution steps
const ExecutionStepSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true,
  },
  nodeName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    required: true,
  },
  startTime: {
    type: Date,
    default: null,
  },
  endTime: {
    type: Date,
    default: null,
  },
  duration: {
    type: Number, // milliseconds
    default: null,
  },
  logs: [{
    type: String,
  }],
  error: {
    type: String,
    default: null,
  },
}, { _id: false });

const ExecutionSchema = new mongoose.Schema({
  executionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  workflowId: {
    type: String,
    required: true,
    index: true,
  },
  workflowName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING',
    index: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    default: null,
  },
  duration: {
    type: Number, // milliseconds
    default: null,
  },
  triggeredBy: {
    type: String,
    required: true,
    index: true,
  },
  steps: [ExecutionStepSchema],
  totalNodes: {
    type: Number,
    default: 0,
  },
  completedNodes: {
    type: Number,
    default: 0,
  },
  failedNodes: {
    type: Number,
    default: 0,
  },
  progress: {
    type: Number, // 0-100
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
ExecutionSchema.index({ workflowId: 1, startTime: -1 });
ExecutionSchema.index({ status: 1 });
ExecutionSchema.index({ triggeredBy: 1 });
ExecutionSchema.index({ createdAt: -1 });

// Virtual for execution ID
ExecutionSchema.virtual('id').get(function() {
  return this.executionId;
});

// Pre-save hook to calculate computed fields
ExecutionSchema.pre('save', function(next) {
  if (this.steps && this.steps.length > 0) {
    this.totalNodes = this.steps.length;
    this.completedNodes = this.steps.filter(s => s.status === 'COMPLETED').length;
    this.failedNodes = this.steps.filter(s => s.status === 'FAILED').length;
    this.progress = this.totalNodes > 0
      ? Math.round((this.completedNodes / this.totalNodes) * 100)
      : 0;
  }

  if (this.startTime && this.endTime) {
    this.duration = this.endTime.getTime() - this.startTime.getTime();
  }

  next();
});

// toJSON transform
ExecutionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Execution', ExecutionSchema);
