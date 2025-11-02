/**
 * Central export file for all mock data
 * Provides easy access to all mock factories and pre-configured data
 */

// Workflow mocks
export * from './mockWorkflow';
export * from './mockExecution';
export * from './mockNode';

// Project and user mocks
export * from './mockProject';
export * from './mockUser';

// Model registry mocks
export * from './mockRegisteredModel';

// Template data
export * from './workflowTemplates';

/**
 * Re-export commonly used mock collections for convenience
 */
export { MOCK_WORKFLOWS } from './mockWorkflow';
export { MOCK_EXECUTIONS } from './mockExecution';
export { MOCK_NODES } from './mockNode';
export { MOCK_PROJECTS } from './mockProject';
export { MOCK_USERS } from './mockUser';
export { MOCK_REGISTERED_MODELS } from './mockRegisteredModel';
export { WORKFLOW_TEMPLATES } from './workflowTemplates';
