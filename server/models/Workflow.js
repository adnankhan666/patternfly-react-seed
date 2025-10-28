const mongoose = require('mongoose');

const WorkflowSchema = new mongoose.Schema({
  workflowId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  nodes: {
    type: Array,
    default: [],
  },
  connections: {
    type: Array,
    default: [],
  },
  metadata: {
    type: Object,
    default: {},
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'paused'],
    default: 'draft',
  },
  version: {
    type: Number,
    default: 1,
  },
  createdBy: {
    type: String,
    default: 'anonymous',
  },
  lastExecutedAt: {
    type: Date,
    default: null,
  },
  executionCount: {
    type: Number,
    default: 0,
  },
  tags: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Indexes for performance
WorkflowSchema.index({ createdBy: 1 });
WorkflowSchema.index({ status: 1 });
WorkflowSchema.index({ createdAt: -1 });
WorkflowSchema.index({ updatedAt: -1 });

// Virtual for workflow ID
WorkflowSchema.virtual('id').get(function() {
  return this.workflowId;
});

// Ensure virtuals are included in JSON output
WorkflowSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Workflow = mongoose.model('Workflow', WorkflowSchema);

module.exports = Workflow;
