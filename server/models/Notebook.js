const mongoose = require('mongoose');

const NotebookSchema = new mongoose.Schema(
  {
    notebookId: {
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
      enum: ['RUNNING', 'STOPPED', 'STARTING', 'STOPPING', 'ERROR'],
      default: 'STOPPED',
      index: true,
    },
    image: {
      type: String,
      required: true,
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
    size: {
      type: String,
      enum: ['Small', 'Medium', 'Large', 'X Large'],
      default: 'Small',
    },
    gpus: {
      type: Number,
      default: 0,
    },
    url: {
      type: String,
      default: '',
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    storageSize: {
      type: String,
      default: '10Gi',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notebook', NotebookSchema);
