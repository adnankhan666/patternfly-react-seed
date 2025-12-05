const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  projectId: {
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
  displayName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  owner: {
    type: String,
    required: true,
    index: true,
  },
  phase: {
    type: String,
    enum: ['Active', 'Terminating'],
    default: 'Active',
    index: true,
  },
  tags: [{
    type: String,
  }],
  workflowCount: {
    type: Number,
    default: 0,
  },
  collaborators: [{
    type: String, // User IDs
  }],
}, {
  timestamps: true,
});

// Indexes for faster queries
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ phase: 1 });
ProjectSchema.index({ createdAt: -1 });

// Virtual for project ID
ProjectSchema.virtual('id').get(function() {
  return this.projectId;
});

// toJSON transform to match frontend interface
ProjectSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Project', ProjectSchema);
