const mongoose = require('mongoose');
const Project = require('./models/Project');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/odh-workflows';

async function addCanvasProjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Add Canvas-style projects
    const canvasProjects = [
      {
        projectId: 'mydsproject-1',
        name: 'mydsproject-1',
        displayName: 'My Data Science Project 1',
        description: 'First data science workspace for ML experiments',
        owner: 'user-admin',
        phase: 'Active',
        tags: ['datascience', 'ml', 'workspace'],
        workflowCount: 2,
        collaborators: ['user1@redhat.com', 'user2@redhat.com'],
      },
      {
        projectId: 'mydsproject-2',
        name: 'mydsproject-2',
        displayName: 'My Data Science Project 2',
        description: 'Second data science workspace for deep learning',
        owner: 'user-admin',
        phase: 'Active',
        tags: ['datascience', 'deeplearning', 'workspace'],
        workflowCount: 3,
        collaborators: ['user1@redhat.com'],
      },
      {
        projectId: 'mydsproject-3',
        name: 'mydsproject-3',
        displayName: 'My Data Science Project 3',
        description: 'Third data science workspace for NLP',
        owner: 'user-admin',
        phase: 'Active',
        tags: ['datascience', 'nlp', 'workspace'],
        workflowCount: 1,
        collaborators: ['user3@redhat.com'],
      },
      {
        projectId: 'myspace',
        name: 'myspace',
        displayName: 'My Space',
        description: 'Personal workspace for ML experiments',
        owner: 'user-admin',
        phase: 'Active',
        tags: ['workspace', 'ml', 'experiments'],
        workflowCount: 4,
        collaborators: ['user1@redhat.com', 'user4@redhat.com'],
      },
      {
        projectId: 'cv-workspace',
        name: 'cv-workspace',
        displayName: 'Computer Vision Workspace',
        description: 'Image classification and object detection projects',
        owner: 'cv-team',
        phase: 'Active',
        tags: ['computer-vision', 'image', 'detection'],
        workflowCount: 5,
        collaborators: ['cv1@redhat.com', 'cv2@redhat.com'],
      },
      {
        projectId: 'nlp-experiments',
        name: 'nlp-experiments',
        displayName: 'NLP Experiments',
        description: 'Natural language processing research and experiments',
        owner: 'nlp-team',
        phase: 'Active',
        tags: ['nlp', 'research', 'experiments'],
        workflowCount: 6,
        collaborators: ['nlp1@redhat.com'],
      },
      {
        projectId: 'model-serving',
        name: 'model-serving',
        displayName: 'Model Serving Platform',
        description: 'Production model deployment and serving',
        owner: 'ml-ops-team',
        phase: 'Active',
        tags: ['production', 'serving', 'mlops'],
        workflowCount: 8,
        collaborators: ['ops1@redhat.com', 'ops2@redhat.com', 'ops3@redhat.com'],
      },
    ];

    // Insert projects (replace existing if they exist)
    for (const project of canvasProjects) {
      await Project.findOneAndUpdate(
        { projectId: project.projectId },
        project,
        { upsert: true, new: true }
      );
      console.log(`✅ Added/Updated project: ${project.name}`);
    }

    console.log('\n✅ Canvas projects added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding canvas projects:', error);
    process.exit(1);
  }
}

addCanvasProjects();
