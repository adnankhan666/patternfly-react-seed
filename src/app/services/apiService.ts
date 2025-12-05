import { useState, useEffect } from 'react';

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Types
export interface Model {
  modelId: string;
  name: string;
  owner: string;
  state: string;
  description: string;
  customProperties?: {
    framework?: string;
    version?: string;
    accuracy?: number;
    [key: string]: any;
  };
  externalID?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  projectId: string;
  name: string;
  displayName: string;
  description: string;
  owner: string;
  phase: string;
  tags: string[];
  workflowCount: number;
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Execution {
  executionId: string;
  workflowId: string;
  workflowName: string;
  status: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  triggeredBy: string;
  steps: any[];
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  workflowId: string;
  name: string;
  description: string;
  nodes: any[];
  connections: any[];
  status: string;
  version: number;
  createdBy: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

// Fetch functions
export const fetchModels = async (): Promise<Model[]> => {
  const response = await fetch(`${API_URL}/api/models`);
  if (!response.ok) throw new Error('Failed to fetch models');
  const data = await response.json();
  return data.models || [];
};

export const fetchProjects = async (): Promise<Project[]> => {
  const response = await fetch(`${API_URL}/api/projects`);
  if (!response.ok) throw new Error('Failed to fetch projects');
  const data = await response.json();
  return data.projects || [];
};

export const fetchExecutions = async (): Promise<Execution[]> => {
  const response = await fetch(`${API_URL}/api/executions`);
  if (!response.ok) throw new Error('Failed to fetch executions');
  const data = await response.json();
  return data.executions || [];
};

export const fetchWorkflows = async (): Promise<Workflow[]> => {
  const response = await fetch(`${API_URL}/api/workflows`);
  if (!response.ok) throw new Error('Failed to fetch workflows');
  const data = await response.json();
  return data.workflows || [];
};

// React Hooks
export const useModels = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        const data = await fetchModels();
        setModels(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load models');
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  return { models, loading, error, refetch: () => fetchModels().then(setModels) };
};

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const data = await fetchProjects();
        setProjects(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  return { projects, loading, error, refetch: () => fetchProjects().then(setProjects) };
};

export const useExecutions = () => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExecutions = async () => {
      try {
        setLoading(true);
        const data = await fetchExecutions();
        setExecutions(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load executions');
        setExecutions([]);
      } finally {
        setLoading(false);
      }
    };

    loadExecutions();
  }, []);

  return { executions, loading, error, refetch: () => fetchExecutions().then(setExecutions) };
};

export const useWorkflows = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setLoading(true);
        const data = await fetchWorkflows();
        setWorkflows(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workflows');
        setWorkflows([]);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, []);

  return { workflows, loading, error, refetch: () => fetchWorkflows().then(setWorkflows) };
};

// Pipeline types
export interface Pipeline {
  pipelineId: string;
  name: string;
  description: string;
  version: number;
  status: string;
  owner: string;
  projectId?: string;
  steps: any[];
  schedule: {
    enabled: boolean;
    cron?: string;
    timezone?: string;
  };
  lastRunTime?: string;
  nextRunTime?: string;
  runsCount: number;
  successRate: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const fetchPipelines = async (): Promise<Pipeline[]> => {
  const response = await fetch(`${API_URL}/api/pipelines`);
  if (!response.ok) throw new Error('Failed to fetch pipelines');
  const data = await response.json();
  return data.pipelines || [];
};

export const usePipelines = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPipelines = async () => {
      try {
        setLoading(true);
        const data = await fetchPipelines();
        setPipelines(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pipelines');
        setPipelines([]);
      } finally {
        setLoading(false);
      }
    };

    loadPipelines();
  }, []);

  return { pipelines, loading, error, refetch: () => fetchPipelines().then(setPipelines) };
};

// Experiment types
export interface Experiment {
  experimentId: string;
  name: string;
  description: string;
  status: string;
  projectId?: string;
  owner: string;
  framework: string;
  parameters: Record<string, any>;
  metrics: Record<string, number>;
  artifacts?: Array<{
    name: string;
    path: string;
    type: string;
    size: number;
  }>;
  startTime: string;
  endTime?: string;
  duration?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const fetchExperiments = async (): Promise<Experiment[]> => {
  const response = await fetch(`${API_URL}/api/experiments`);
  if (!response.ok) throw new Error('Failed to fetch experiments');
  const data = await response.json();
  return data.experiments || [];
};

export const useExperiments = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExperiments = async () => {
      try {
        setLoading(true);
        const data = await fetchExperiments();
        setExperiments(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load experiments');
        setExperiments([]);
      } finally {
        setLoading(false);
      }
    };

    loadExperiments();
  }, []);

  return { experiments, loading, error, refetch: () => fetchExperiments().then(setExperiments) };
};

// Notebook types
export interface Notebook {
  notebookId: string;
  name: string;
  description: string;
  status: string;
  image: string;
  owner: string;
  projectId?: string;
  size: string;
  gpus: number;
  url?: string;
  lastActivity: string;
  storageSize: string;
  createdAt: string;
  updatedAt: string;
}

export const fetchNotebooks = async (): Promise<Notebook[]> => {
  const response = await fetch(`${API_URL}/api/notebooks`);
  if (!response.ok) throw new Error('Failed to fetch notebooks');
  const data = await response.json();
  return data.notebooks || [];
};

export const useNotebooks = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNotebooks = async () => {
      try {
        setLoading(true);
        const data = await fetchNotebooks();
        setNotebooks(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notebooks');
        setNotebooks([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotebooks();
  }, []);

  return { notebooks, loading, error, refetch: () => fetchNotebooks().then(setNotebooks) };
};

// Training Job types
export interface TrainingJob {
  jobId: string;
  name: string;
  description: string;
  status: string;
  framework: string;
  modelType: string;
  owner: string;
  projectId?: string;
  datasetPath: string;
  hyperparameters: Record<string, any>;
  resources: {
    cpus: number;
    memory: string;
    gpus: number;
  };
  metrics?: {
    accuracy?: number;
    loss?: number;
    epoch?: number;
    trainingTime?: number;
  };
  startTime?: string;
  endTime?: string;
  duration?: number;
  outputModelPath?: string;
  logs?: Array<{
    timestamp: string;
    message: string;
    level: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const fetchTrainingJobs = async (): Promise<TrainingJob[]> => {
  const response = await fetch(`${API_URL}/api/training`);
  if (!response.ok) throw new Error('Failed to fetch training jobs');
  const data = await response.json();
  return data.trainingJobs || [];
};

export const useTrainingJobs = () => {
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrainingJobs = async () => {
      try {
        setLoading(true);
        const data = await fetchTrainingJobs();
        setTrainingJobs(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load training jobs');
        setTrainingJobs([]);
      } finally {
        setLoading(false);
      }
    };

    loadTrainingJobs();
  }, []);

  return { trainingJobs, loading, error, refetch: () => fetchTrainingJobs().then(setTrainingJobs) };
};
