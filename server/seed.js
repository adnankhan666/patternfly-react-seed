const User = require('./models/User');
const Project = require('./models/Project');
const Workflow = require('./models/Workflow');
const Execution = require('./models/Execution');
const RegisteredModel = require('./models/RegisteredModel');

/**
 * Check if database needs seeding
 */
const needsSeeding = async () => {
  try {
    const userCount = await User.countDocuments();
    return userCount === 0;
  } catch (error) {
    console.error('Error checking if seeding is needed:', error);
    return false;
  }
};

/**
 * Seed users
 */
const seedUsers = async () => {
  console.log('📝 Seeding users...');

  const users = [
    {
      userId: 'user-admin',
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123', // Will be hashed by pre-save hook
      displayName: 'Admin User',
      role: 'ADMIN',
      projects: [],
      preferences: {
        theme: 'light',
        emailNotifications: true,
        language: 'en',
        timezone: 'UTC',
      },
    },
    {
      userId: 'user-editor',
      username: 'editor',
      email: 'editor@example.com',
      password: 'editor123',
      displayName: 'Editor User',
      role: 'EDITOR',
      projects: [],
      preferences: {
        theme: 'light',
        emailNotifications: true,
      },
    },
    {
      userId: 'user-viewer',
      username: 'viewer',
      email: 'viewer@example.com',
      password: 'viewer123',
      displayName: 'Viewer User',
      role: 'VIEWER',
      projects: [],
    },
    {
      userId: 'user-ds',
      username: 'datascientist',
      email: 'ds@example.com',
      password: 'ds123',
      displayName: 'Data Scientist',
      role: 'EDITOR',
      projects: [],
      preferences: {
        theme: 'dark',
        emailNotifications: true,
      },
    },
    {
      userId: 'user-mle',
      username: 'mlengineer',
      email: 'mle@example.com',
      password: 'mle123',
      displayName: 'ML Engineer',
      role: 'EDITOR',
      projects: [],
      preferences: {
        theme: 'dark',
        emailNotifications: false,
      },
    },
  ];

  // Use .save() instead of insertMany to trigger password hashing pre-save hook
  for (const userData of users) {
    const user = new User(userData);
    await user.save();
  }
  console.log(`✅ Created ${users.length} users`);

  return users;
};

/**
 * Seed projects
 */
const seedProjects = async () => {
  console.log('📝 Seeding projects...');

  const projects = [
    {
      projectId: 'project-active',
      name: 'ml-training-project',
      displayName: 'ML Training Project',
      description: 'Production ML model training workflows',
      owner: 'user-admin',
      phase: 'Active',
      tags: ['ml', 'production', 'training'],
      workflowCount: 0,
      collaborators: ['user-admin', 'user-ds'],
    },
    {
      projectId: 'project-data',
      name: 'data-processing',
      displayName: 'Data Processing Pipelines',
      description: 'ETL and data transformation workflows',
      owner: 'user-editor',
      phase: 'Active',
      tags: ['data', 'etl', 'processing'],
      workflowCount: 0,
      collaborators: ['user-editor', 'user-mle'],
    },
    {
      projectId: 'project-serving',
      name: 'model-serving',
      displayName: 'Model Deployment',
      description: 'Model serving and deployment workflows',
      owner: 'user-mle',
      phase: 'Active',
      tags: ['serving', 'deployment', 'production'],
      workflowCount: 0,
      collaborators: ['user-mle', 'user-admin'],
    },
    {
      projectId: 'project-experimental',
      name: 'experimental-workflows',
      displayName: 'Experimental Workflows',
      description: 'Testing and experimental workflow development',
      owner: 'user-ds',
      phase: 'Active',
      tags: ['experimental', 'testing'],
      workflowCount: 0,
      collaborators: ['user-ds', 'user-editor'],
    },
  ];

  await Project.insertMany(projects);
  console.log(`✅ Created ${projects.length} projects`);

  return projects;
};

/**
 * Seed workflows
 */
const seedWorkflows = async () => {
  console.log('📝 Seeding workflows...');

  const workflows = [
    {
      workflowId: 'workflow-draft',
      name: 'Draft Workflow',
      description: 'A workflow in draft state',
      nodes: [],
      connections: [],
      status: 'draft',
      version: 1,
      createdBy: 'user-admin',
      metadata: {
        tags: ['ml', 'training'],
      },
    },
    {
      workflowId: 'workflow-active',
      name: 'Active Production Workflow',
      description: 'Currently active workflow in production',
      nodes: [],
      connections: [],
      status: 'active',
      version: 3,
      createdBy: 'user-mle',
      metadata: {
        tags: ['production'],
      },
    },
    {
      workflowId: 'workflow-with-nodes',
      name: 'ML Training Pipeline',
      description: 'End-to-end ML training and deployment workflow',
      nodes: [
        {
          id: 'node-1',
          type: 'notebooks',
          label: 'Data Preparation',
          position: { x: 100, y: 100 },
          size: { width: 180, height: 100 },
          data: {
            color: '#10b981',
            description: 'Prepare and clean training data',
          },
        },
        {
          id: 'node-2',
          type: 'training',
          label: 'Model Training',
          position: { x: 400, y: 100 },
          size: { width: 180, height: 100 },
          data: {
            color: '#3b82f6',
            description: 'Train ML model with prepared data',
          },
        },
        {
          id: 'node-3',
          type: 'model-serving',
          label: 'Deploy Model',
          position: { x: 700, y: 100 },
          size: { width: 180, height: 100 },
          data: {
            color: '#f59e0b',
            description: 'Deploy trained model to production',
          },
        },
      ],
      connections: [
        {
          id: 'conn-1',
          source: 'node-1',
          target: 'node-2',
          sourceConnector: 'right',
          targetConnector: 'left',
        },
        {
          id: 'conn-2',
          source: 'node-2',
          target: 'node-3',
          sourceConnector: 'right',
          targetConnector: 'left',
        },
      ],
      status: 'active',
      version: 1,
      createdBy: 'user-ds',
      metadata: {
        tags: ['ml', 'pipeline'],
      },
    },
  ];

  await Workflow.insertMany(workflows);
  console.log(`✅ Created ${workflows.length} workflows`);

  return workflows;
};

/**
 * Seed executions
 */
const seedExecutions = async () => {
  console.log('📝 Seeding executions...');

  const executions = [
    {
      executionId: 'exec-completed',
      workflowId: 'workflow-with-nodes',
      workflowName: 'ML Training Pipeline',
      status: 'COMPLETED',
      startTime: new Date('2024-10-28T14:00:00Z'),
      endTime: new Date('2024-10-28T14:05:30Z'),
      triggeredBy: 'user-ds',
      steps: [
        {
          nodeId: 'node-1',
          nodeName: 'Data Preparation',
          status: 'COMPLETED',
          startTime: new Date('2024-10-28T14:00:00Z'),
          endTime: new Date('2024-10-28T14:01:30Z'),
          duration: 90000,
          logs: [
            'Loading dataset...',
            'Cleaning data...',
            'Feature engineering completed',
          ],
        },
        {
          nodeId: 'node-2',
          nodeName: 'Model Training',
          status: 'COMPLETED',
          startTime: new Date('2024-10-28T14:01:30Z'),
          endTime: new Date('2024-10-28T14:04:00Z'),
          duration: 150000,
          logs: [
            'Initializing model...',
            'Training epoch 1/10: loss=0.45',
            'Training epoch 10/10: loss=0.12',
            'Model training completed',
          ],
        },
        {
          nodeId: 'node-3',
          nodeName: 'Deploy Model',
          status: 'COMPLETED',
          startTime: new Date('2024-10-28T14:04:00Z'),
          endTime: new Date('2024-10-28T14:05:30Z'),
          duration: 90000,
          logs: [
            'Preparing deployment...',
            'Uploading model artifacts...',
            'Model deployed successfully',
          ],
        },
      ],
    },
    {
      executionId: 'exec-running',
      workflowId: 'workflow-active',
      workflowName: 'Active Production Workflow',
      status: 'RUNNING',
      startTime: new Date(Date.now() - 120000), // Started 2 minutes ago
      triggeredBy: 'user-mle',
      steps: [],
    },
    {
      executionId: 'exec-failed',
      workflowId: 'workflow-with-nodes',
      workflowName: 'ML Training Pipeline',
      status: 'FAILED',
      startTime: new Date('2024-10-28T13:00:00Z'),
      endTime: new Date('2024-10-28T13:02:15Z'),
      triggeredBy: 'user-ds',
      steps: [
        {
          nodeId: 'node-1',
          nodeName: 'Data Preparation',
          status: 'COMPLETED',
          duration: 90000,
          logs: ['Data preparation completed'],
        },
        {
          nodeId: 'node-2',
          nodeName: 'Model Training',
          status: 'FAILED',
          duration: 45000,
          error: 'Out of memory error during model training',
          logs: [
            'Initializing model...',
            'ERROR: OOM - insufficient GPU memory',
          ],
        },
      ],
    },
  ];

  await Execution.insertMany(executions);
  console.log(`✅ Created ${executions.length} executions`);

  return executions;
};

/**
 * Seed registered models
 */
const seedModels = async () => {
  console.log('📝 Seeding registered models...');

  const models = [
    {
      modelId: '1',
      name: 'Live Production Model',
      owner: 'user-mle',
      state: 'LIVE',
      description: 'Production model serving real-time predictions',
      customProperties: {
        framework: 'tensorflow',
        version: '2.0',
        accuracy: 0.95,
      },
      externalID: 'ext-model-001',
    },
    {
      modelId: '2',
      name: 'Archived Legacy Model',
      owner: 'user-ds',
      state: 'ARCHIVED',
      description: 'Legacy model replaced by newer version',
      customProperties: {
        framework: 'pytorch',
        version: '1.0',
        accuracy: 0.88,
      },
      externalID: 'ext-model-002',
    },
    {
      modelId: '3',
      name: 'Training Model v3',
      owner: 'user-ds',
      state: 'LIVE',
      description: 'Model currently in training phase',
      customProperties: {
        framework: 'scikit-learn',
        version: '3.0',
        status: 'training',
      },
      externalID: 'ext-model-003',
    },
  ];

  await RegisteredModel.insertMany(models);
  console.log(`✅ Created ${models.length} registered models`);

  return models;
};

/**
 * Main seeding function
 */
const seedDatabase = async () => {
  try {
    const shouldSeed = await needsSeeding();

    if (!shouldSeed) {
      console.log('ℹ️  Database already seeded, skipping...');
      return;
    }

    console.log('🌱 Starting database seeding...');

    await seedUsers();
    await seedProjects();
    await seedWorkflows();
    await seedExecutions();
    await seedModels();

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('  admin / admin123 (ADMIN)');
    console.log('  editor / editor123 (EDITOR)');
    console.log('  viewer / viewer123 (VIEWER)');
    console.log('  datascientist / ds123 (EDITOR)');
    console.log('  mlengineer / mle123 (EDITOR)\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

module.exports = {
  seedDatabase,
};
