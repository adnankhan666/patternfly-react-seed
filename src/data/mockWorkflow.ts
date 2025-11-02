/**
 * Mock data factory for Workflows
 * Based on ODH Dashboard mock patterns
 */

import { NodeData, Connection } from '../app/Canvas/types';

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  EXECUTING = 'EXECUTING',
}

export interface Workflow {
  id: string;
  projectName: string;
  description: string;
  nodes: NodeData[];
  connections: Connection[];
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  tags?: string[];
  isTemplate?: boolean;
  category?: string;
}

type MockWorkflowType = {
  id?: string;
  projectName?: string;
  description?: string;
  nodes?: NodeData[];
  connections?: Connection[];
  status?: WorkflowStatus;
  createdBy?: string;
  version?: number;
  tags?: string[];
  isTemplate?: boolean;
  category?: string;
};

/**
 * Factory function to create mock Workflow instances for testing
 */
export const mockWorkflow = ({
  id = 'workflow-1',
  projectName = 'Test Workflow',
  description = 'A test workflow for ML training',
  nodes = [],
  connections = [],
  status = WorkflowStatus.DRAFT,
  createdBy = 'test-user',
  version = 1,
  tags = ['ml', 'training'],
  isTemplate = false,
  category = 'ml-pipeline',
}: MockWorkflowType = {}): Workflow => ({
  id,
  projectName,
  description,
  nodes,
  connections,
  status,
  createdAt: '2024-10-28T10:00:00Z',
  updatedAt: '2024-10-28T14:00:00Z',
  createdBy,
  version,
  tags,
  isTemplate,
  category,
});

/**
 * Create a workflow with sample nodes and connections
 */
export const mockWorkflowWithNodes = (): Workflow => {
  const nodes: NodeData[] = [
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
  ];

  const connections: Connection[] = [
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
  ];

  return mockWorkflow({
    id: 'workflow-with-nodes',
    projectName: 'ML Training Pipeline',
    description: 'End-to-end ML training and deployment workflow',
    nodes,
    connections,
    status: WorkflowStatus.ACTIVE,
  });
};

/**
 * Collection of pre-configured mock workflows
 */
export const MOCK_WORKFLOWS = {
  draft: mockWorkflow({
    id: 'workflow-draft',
    projectName: 'Draft Workflow',
    status: WorkflowStatus.DRAFT,
    description: 'A workflow in draft state',
  }),

  active: mockWorkflow({
    id: 'workflow-active',
    projectName: 'Active Production Workflow',
    status: WorkflowStatus.ACTIVE,
    description: 'Currently active workflow in production',
    version: 3,
  }),

  executing: mockWorkflow({
    id: 'workflow-executing',
    projectName: 'Executing Workflow',
    status: WorkflowStatus.EXECUTING,
    description: 'Workflow currently being executed',
  }),

  archived: mockWorkflow({
    id: 'workflow-archived',
    projectName: 'Archived Legacy Workflow',
    status: WorkflowStatus.ARCHIVED,
    description: 'Legacy workflow no longer in use',
    version: 1,
  }),

  withNodes: mockWorkflowWithNodes(),
};

/**
 * Mock workflow list response
 */
export const mockWorkflowsList = (workflows: Workflow[] = Object.values(MOCK_WORKFLOWS)) => ({
  items: workflows,
  total: workflows.length,
  page: 1,
  pageSize: 10,
});
