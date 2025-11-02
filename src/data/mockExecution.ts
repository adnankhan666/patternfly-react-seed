/**
 * Mock data factory for Workflow Executions
 * Tracks workflow execution runs, status, and results
 */

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface ExecutionStep {
  nodeId: string;
  nodeName: string;
  status: ExecutionStatus;
  startTime?: string;
  endTime?: string;
  duration?: number; // milliseconds
  logs?: string[];
  error?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  duration?: number; // milliseconds
  triggeredBy: string;
  steps: ExecutionStep[];
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  progress: number; // 0-100
}

type MockExecutionType = {
  id?: string;
  workflowId?: string;
  workflowName?: string;
  status?: ExecutionStatus;
  startTime?: string;
  endTime?: string;
  triggeredBy?: string;
  steps?: ExecutionStep[];
};

/**
 * Factory function to create mock WorkflowExecution instances
 */
export const mockExecution = ({
  id = 'exec-1',
  workflowId = 'workflow-1',
  workflowName = 'Test Workflow',
  status = ExecutionStatus.COMPLETED,
  startTime = '2024-10-28T14:00:00Z',
  endTime = '2024-10-28T14:05:30Z',
  triggeredBy = 'test-user',
  steps = [],
}: MockExecutionType = {}): WorkflowExecution => {
  const totalNodes = steps.length || 3;
  const completedNodes = steps.filter(s => s.status === ExecutionStatus.COMPLETED).length;
  const failedNodes = steps.filter(s => s.status === ExecutionStatus.FAILED).length;
  const progress = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const duration = end - start;

  return {
    id,
    workflowId,
    workflowName,
    status,
    startTime,
    endTime,
    duration,
    triggeredBy,
    steps,
    totalNodes,
    completedNodes,
    failedNodes,
    progress,
  };
};

/**
 * Create execution with sample steps
 */
export const mockExecutionWithSteps = (): WorkflowExecution => {
  const steps: ExecutionStep[] = [
    {
      nodeId: 'node-1',
      nodeName: 'Data Preparation',
      status: ExecutionStatus.COMPLETED,
      startTime: '2024-10-28T14:00:00Z',
      endTime: '2024-10-28T14:01:30Z',
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
      status: ExecutionStatus.COMPLETED,
      startTime: '2024-10-28T14:01:30Z',
      endTime: '2024-10-28T14:04:00Z',
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
      status: ExecutionStatus.COMPLETED,
      startTime: '2024-10-28T14:04:00Z',
      endTime: '2024-10-28T14:05:30Z',
      duration: 90000,
      logs: [
        'Preparing deployment...',
        'Uploading model artifacts...',
        'Model deployed successfully',
      ],
    },
  ];

  return mockExecution({
    id: 'exec-with-steps',
    workflowName: 'ML Training Pipeline',
    status: ExecutionStatus.COMPLETED,
    steps,
  });
};

/**
 * Collection of pre-configured mock executions
 */
export const MOCK_EXECUTIONS = {
  completed: mockExecution({
    id: 'exec-completed',
    workflowName: 'Completed Workflow',
    status: ExecutionStatus.COMPLETED,
    endTime: '2024-10-28T14:05:30Z',
  }),

  running: mockExecution({
    id: 'exec-running',
    workflowName: 'Running Workflow',
    status: ExecutionStatus.RUNNING,
    startTime: new Date(Date.now() - 120000).toISOString(), // Started 2 minutes ago
    endTime: undefined,
  }),

  failed: mockExecution({
    id: 'exec-failed',
    workflowName: 'Failed Workflow',
    status: ExecutionStatus.FAILED,
    endTime: '2024-10-28T14:02:15Z',
    steps: [
      {
        nodeId: 'node-1',
        nodeName: 'Data Preparation',
        status: ExecutionStatus.COMPLETED,
        duration: 90000,
      },
      {
        nodeId: 'node-2',
        nodeName: 'Model Training',
        status: ExecutionStatus.FAILED,
        duration: 45000,
        error: 'Out of memory error during model training',
        logs: [
          'Initializing model...',
          'ERROR: OOM - insufficient GPU memory',
        ],
      },
    ],
  }),

  pending: mockExecution({
    id: 'exec-pending',
    workflowName: 'Pending Workflow',
    status: ExecutionStatus.PENDING,
    startTime: new Date(Date.now() - 10000).toISOString(),
    endTime: undefined,
  }),

  withSteps: mockExecutionWithSteps(),
};

/**
 * Mock execution history for a workflow
 */
export const mockExecutionHistory = (
  workflowId: string = 'workflow-1',
  count: number = 5,
): WorkflowExecution[] => {
  const executions: WorkflowExecution[] = [];

  for (let i = 0; i < count; i++) {
    const startDate = new Date(Date.now() - (i * 86400000)); // Each execution 1 day apart
    const statuses = [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.RUNNING];
    const status = statuses[i % statuses.length];

    executions.push(mockExecution({
      id: `exec-${workflowId}-${i}`,
      workflowId,
      workflowName: `Workflow ${workflowId} Execution ${i + 1}`,
      status,
      startTime: startDate.toISOString(),
      endTime: status === ExecutionStatus.RUNNING ? undefined : new Date(startDate.getTime() + 300000).toISOString(),
      triggeredBy: i % 2 === 0 ? 'test-user' : 'admin-user',
    }));
  }

  return executions;
};
