const Joi = require('joi');

// Project validation schemas
const projectSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    displayName: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).allow('', null),
    owner: Joi.string().required(),
    phase: Joi.string().valid('Active', 'Terminating').default('Active'),
    tags: Joi.array().items(Joi.string().max(30)).max(10).default([]),
    workflowCount: Joi.number().integer().min(0).default(0),
    collaborators: Joi.array().items(Joi.string().email()).max(20).default([]),
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(50),
    displayName: Joi.string().min(3).max(100),
    description: Joi.string().max(500).allow('', null),
    owner: Joi.string(),
    phase: Joi.string().valid('Active', 'Terminating'),
    tags: Joi.array().items(Joi.string().max(30)).max(10),
    workflowCount: Joi.number().integer().min(0),
    collaborators: Joi.array().items(Joi.string().email()).max(20),
  }).min(1), // At least one field must be provided
};

// Model validation schemas
const modelSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    owner: Joi.string().required(),
    state: Joi.string().valid('LIVE', 'ARCHIVED', 'UNKNOWN').default('LIVE'),
    description: Joi.string().max(500).allow('', null),
    customProperties: Joi.object().pattern(Joi.string(), Joi.any()),
    externalID: Joi.string().max(100).allow('', null),
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    owner: Joi.string(),
    state: Joi.string().valid('LIVE', 'ARCHIVED', 'UNKNOWN'),
    description: Joi.string().max(500).allow('', null),
    customProperties: Joi.object().pattern(Joi.string(), Joi.any()),
    externalID: Joi.string().max(100).allow('', null),
  }).min(1),
};

// Execution validation schemas
const executionSchemas = {
  create: Joi.object({
    workflowId: Joi.string().required(),
    workflowName: Joi.string().min(3).max(100).required(),
    status: Joi.string().valid('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED').default('PENDING'),
    triggeredBy: Joi.string().required(),
    steps: Joi.array().items(Joi.object()).default([]),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED').required(),
  }),
};

// Pipeline validation schemas
const pipelineSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).allow('', null),
    owner: Joi.string().required(),
    projectId: Joi.string().allow('', null),
    version: Joi.string().default('1.0'),
    status: Joi.string().valid('ACTIVE', 'DRAFT', 'ARCHIVED').default('DRAFT'),
    steps: Joi.array().items(Joi.object()).min(1).required(),
    schedule: Joi.object({
      enabled: Joi.boolean(),
      cron: Joi.string(),
    }).allow(null),
    tags: Joi.array().items(Joi.string().max(30)).max(10).default([]),
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().max(500).allow('', null),
    owner: Joi.string(),
    version: Joi.string(),
    status: Joi.string().valid('ACTIVE', 'DRAFT', 'ARCHIVED'),
    steps: Joi.array().items(Joi.object()).min(1),
    schedule: Joi.object({
      enabled: Joi.boolean(),
      cron: Joi.string(),
    }).allow(null),
    tags: Joi.array().items(Joi.string().max(30)).max(10),
  }).min(1),
};

// Experiment validation schemas
const experimentSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).allow('', null),
    owner: Joi.string().required(),
    framework: Joi.string().min(2).max(50).required(),
    status: Joi.string().valid('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED').default('RUNNING'),
    parameters: Joi.object().pattern(Joi.string(), Joi.any()),
    metrics: Joi.object().pattern(Joi.string(), Joi.number()),
    tags: Joi.array().items(Joi.string().max(30)).max(10).default([]),
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().max(500).allow('', null),
    status: Joi.string().valid('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'),
    parameters: Joi.object().pattern(Joi.string(), Joi.any()),
    metrics: Joi.object().pattern(Joi.string(), Joi.number()),
    tags: Joi.array().items(Joi.string().max(30)).max(10),
  }).min(1),
};

// Notebook validation schemas
const notebookSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).allow('', null),
    owner: Joi.string().required(),
    image: Joi.string().required(),
    projectId: Joi.string().allow('', null),
    size: Joi.string().valid('Small', 'Medium', 'Large', 'X-Large').required(),
    gpus: Joi.number().integer().min(0).max(8).default(0),
    storageSize: Joi.string().default('20Gi'),
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().max(500).allow('', null),
    size: Joi.string().valid('Small', 'Medium', 'Large', 'X-Large'),
    gpus: Joi.number().integer().min(0).max(8),
    storageSize: Joi.string(),
  }).min(1),
};

// Training job validation schemas
const trainingJobSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).allow('', null),
    owner: Joi.string().required(),
    framework: Joi.string().min(2).max(50).required(),
    modelType: Joi.string().max(50).allow('', null),
    projectId: Joi.string().allow('', null),
    datasetPath: Joi.string().allow('', null),
    hyperparameters: Joi.object().pattern(Joi.string(), Joi.any()),
    resources: Joi.object({
      cpus: Joi.number().integer().min(1).max(64).required(),
      memory: Joi.string().required(),
      gpus: Joi.number().integer().min(0).max(8).default(0),
    }).required(),
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().max(500).allow('', null),
    status: Joi.string().valid('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'),
    hyperparameters: Joi.object().pattern(Joi.string(), Joi.any()),
    metrics: Joi.object().pattern(Joi.string(), Joi.any()),
  }).min(1),
};

// User validation schemas (for registration)
const userSchemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .message('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    displayName: Joi.string().min(2).max(100).required(),
  }),

  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessages,
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

module.exports = {
  validate,
  projectSchemas,
  modelSchemas,
  executionSchemas,
  pipelineSchemas,
  experimentSchemas,
  notebookSchemas,
  trainingJobSchemas,
  userSchemas,
};
