/**
 * Mock telemetry data for the Telemetry dashboard
 */

export interface SystemMetric {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  networkIO: number;
}

export interface WorkflowMetric {
  timestamp: Date;
  executionDuration: number;
  successRate: number;
}

export interface NodeUsageMetric {
  nodeType: string;
  count: number;
  color: string;
}

export interface TelemetryData {
  systemMetrics: {
    current: {
      cpuUsage: number;
      memoryUsage: number;
      networkIO: number;
      activeWorkflows: number;
      totalExecutions: number;
    };
    historical: SystemMetric[];
  };
  workflowMetrics: {
    successRate: number;
    failureRate: number;
    averageExecutionTime: number;
    historical: WorkflowMetric[];
  };
  userActivity: {
    activeUsers: number;
    totalSessions: number;
    projectsCreated: number;
    workflowsDeployed: number;
  };
  nodeStatistics: NodeUsageMetric[];
}

// Generate historical data for the last 24 hours
const generateHistoricalSystemMetrics = (): SystemMetric[] => {
  const metrics: SystemMetric[] = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000); // hourly data
    metrics.push({
      timestamp,
      cpuUsage: Math.random() * 40 + 30, // 30-70%
      memoryUsage: Math.random() * 30 + 50, // 50-80%
      networkIO: Math.random() * 500 + 100, // 100-600 MB/s
    });
  }

  return metrics;
};

// Generate historical workflow metrics
const generateHistoricalWorkflowMetrics = (): WorkflowMetric[] => {
  const metrics: WorkflowMetric[] = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    metrics.push({
      timestamp,
      executionDuration: Math.random() * 5000 + 2000, // 2-7 seconds
      successRate: Math.random() * 20 + 80, // 80-100%
    });
  }

  return metrics;
};

// Mock telemetry data
export const mockTelemetryData: TelemetryData = {
  systemMetrics: {
    current: {
      cpuUsage: 45.7,
      memoryUsage: 62.3,
      networkIO: 342.5,
      activeWorkflows: 12,
      totalExecutions: 1247,
    },
    historical: generateHistoricalSystemMetrics(),
  },
  workflowMetrics: {
    successRate: 94.2,
    failureRate: 5.8,
    averageExecutionTime: 4.3,
    historical: generateHistoricalWorkflowMetrics(),
  },
  userActivity: {
    activeUsers: 23,
    totalSessions: 156,
    projectsCreated: 34,
    workflowsDeployed: 89,
  },
  nodeStatistics: [
    { nodeType: 'Notebooks', count: 234, color: '#06b6d4' },
    { nodeType: 'Model Serving', count: 189, color: '#8b5cf6' },
    { nodeType: 'Pipelines', count: 167, color: '#10b981' },
    { nodeType: 'Training', count: 145, color: '#f59e0b' },
    { nodeType: 'Experiments', count: 132, color: '#ef4444' },
    { nodeType: 'Model Registry', count: 98, color: '#3b82f6' },
    { nodeType: 'Tuning', count: 76, color: '#ec4899' },
    { nodeType: 'Model Catalog', count: 54, color: '#14b8a6' },
  ],
};

// Export individual metrics for easier access
export const currentSystemMetrics = mockTelemetryData.systemMetrics.current;
export const historicalSystemMetrics = mockTelemetryData.systemMetrics.historical;
export const workflowMetrics = mockTelemetryData.workflowMetrics;
export const userActivity = mockTelemetryData.userActivity;
export const nodeStatistics = mockTelemetryData.nodeStatistics;
