const mongoose = require('mongoose');
const RegisteredModel = require('./models/RegisteredModel');
const Project = require('./models/Project');
const Execution = require('./models/Execution');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/odh-workflows';

async function manualSeed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Add Models
    console.log('Adding models...');
    await RegisteredModel.deleteMany({});
    await RegisteredModel.insertMany([
      {
        modelId: 'model-1',
        name: 'Customer Churn Predictor',
        owner: 'data-science-team',
        state: 'LIVE',
        description: 'Production model for predicting customer churn with 95% accuracy',
        customProperties: {
          framework: 'TensorFlow',
          version: '2.0',
          accuracy: 0.95,
          dataset: 'customer_data_2024'
        },
        externalID: 'ext-model-001'
      },
      {
        modelId: 'model-2',
        name: 'Fraud Detection System',
        owner: 'ml-platform-team',
        state: 'LIVE',
        description: 'Real-time fraud detection using ensemble methods',
        customProperties: {
          framework: 'PyTorch',
          version: '3.1',
          accuracy: 0.98,
          precision: 0.96,
          recall: 0.97
        },
        externalID: 'ext-model-002'
      },
      {
        modelId: 'model-3',
        name: 'Sentiment Analysis Model',
        owner: 'nlp-team',
        state: 'LIVE',
        description: 'Multi-language sentiment classification model',
        customProperties: {
          framework: 'Hugging Face Transformers',
          version: '1.5',
          accuracy: 0.92,
          languages: 'en,es,fr,de'
        },
        externalID: 'ext-model-003'
      },
      {
        modelId: 'model-4',
        name: 'Recommendation Engine v2',
        owner: 'personalization-team',
        state: 'LIVE',
        description: 'Collaborative filtering recommendation system',
        customProperties: {
          framework: 'Scikit-learn',
          version: '2.3',
          accuracy: 0.87,
          mse: 0.32
        },
        externalID: 'ext-model-004'
      },
      {
        modelId: 'model-5',
        name: 'Image Classifier CNN',
        owner: 'computer-vision-team',
        state: 'ARCHIVED',
        description: 'Legacy image classification model',
        customProperties: {
          framework: 'TensorFlow',
          version: '1.0',
          accuracy: 0.89
        },
        externalID: 'ext-model-005'
      }
    ]);
    console.log('✅ Added 5 models');

    // Add Projects
    console.log('Adding projects...');
    await Project.deleteMany({});
    await Project.insertMany([
      {
        projectId: 'project-1',
        name: 'customer-analytics',
        displayName: 'Customer Analytics Platform',
        description: 'End-to-end customer behavior analysis and prediction',
        owner: 'data-science-team',
        phase: 'Active',
        tags: ['analytics', 'customer', 'ml'],
        workflowCount: 5,
        collaborators: ['alice@company.com', 'bob@company.com']
      },
      {
        projectId: 'project-2',
        name: 'fraud-prevention',
        displayName: 'Fraud Prevention System',
        description: 'Real-time fraud detection and prevention',
        owner: 'ml-platform-team',
        phase: 'Active',
        tags: ['security', 'fraud', 'production'],
        workflowCount: 3,
        collaborators: ['carol@company.com', 'dave@company.com']
      },
      {
        projectId: 'project-3',
        name: 'nlp-services',
        displayName: 'NLP Services',
        description: 'Natural language processing workflows',
        owner: 'nlp-team',
        phase: 'Active',
        tags: ['nlp', 'text', 'ai'],
        workflowCount: 7,
        collaborators: ['eve@company.com']
      },
      {
        projectId: 'project-4',
        name: 'recommendation-engine',
        displayName: 'Recommendation Engine',
        description: 'Personalized product recommendations',
        owner: 'personalization-team',
        phase: 'Active',
        tags: ['recommendations', 'personalization'],
        workflowCount: 4,
        collaborators: ['frank@company.com', 'grace@company.com']
      }
    ]);
    console.log('✅ Added 4 projects');

    // Add Executions
    console.log('Adding executions...');
    await Execution.deleteMany({});
    await Execution.insertMany([
      {
        executionId: 'exec-1',
        workflowId: 'workflow-1',
        workflowName: 'ML Training Pipeline',
        status: 'COMPLETED',
        startTime: new Date('2024-10-28T14:00:00Z'),
        endTime: new Date('2024-10-28T14:05:30Z'),
        duration: 330000,
        triggeredBy: 'alice@company.com',
        steps: [],
        totalNodes: 3,
        completedNodes: 3,
        failedNodes: 0,
        progress: 100
      },
      {
        executionId: 'exec-2',
        workflowId: 'workflow-2',
        workflowName: 'Data Processing Pipeline',
        status: 'RUNNING',
        startTime: new Date(Date.now() - 120000),
        duration: 120000,
        triggeredBy: 'bob@company.com',
        steps: [],
        totalNodes: 5,
        completedNodes: 3,
        failedNodes: 0,
        progress: 60
      },
      {
        executionId: 'exec-3',
        workflowId: 'workflow-3',
        workflowName: 'Model Deployment',
        status: 'FAILED',
        startTime: new Date('2024-10-28T13:00:00Z'),
        endTime: new Date('2024-10-28T13:02:15Z'),
        duration: 135000,
        triggeredBy: 'carol@company.com',
        steps: [],
        totalNodes: 4,
        completedNodes: 2,
        failedNodes: 1,
        progress: 50
      }
    ]);
    console.log('✅ Added 3 executions');

    console.log('\n✅ Manual seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

manualSeed();
