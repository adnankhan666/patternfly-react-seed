const mongoose = require('mongoose');

const RegisteredModelSchema = new mongoose.Schema({
  modelId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  owner: {
    type: String,
    required: true,
    index: true,
  },
  state: {
    type: String,
    enum: ['LIVE', 'ARCHIVED', 'UNKNOWN'],
    default: 'LIVE',
    index: true,
  },
  description: {
    type: String,
    default: '',
  },
  customProperties: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  externalID: {
    type: String,
    default: '',
  },
  createTimeSinceEpoch: {
    type: String,
    default: () => Date.now().toString(),
  },
  lastUpdateTimeSinceEpoch: {
    type: String,
    default: () => Date.now().toString(),
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
RegisteredModelSchema.index({ owner: 1 });
RegisteredModelSchema.index({ state: 1 });
RegisteredModelSchema.index({ name: 1 });
RegisteredModelSchema.index({ createdAt: -1 });

// Virtual for model ID
RegisteredModelSchema.virtual('id').get(function() {
  return this.modelId;
});

// Pre-save hook to update timestamp
RegisteredModelSchema.pre('save', function(next) {
  this.lastUpdateTimeSinceEpoch = Date.now().toString();
  next();
});

// toJSON transform
RegisteredModelSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    // Convert Map to plain object
    if (ret.customProperties instanceof Map) {
      ret.customProperties = Object.fromEntries(ret.customProperties);
    }
    return ret;
  }
});

module.exports = mongoose.model('RegisteredModel', RegisteredModelSchema);
