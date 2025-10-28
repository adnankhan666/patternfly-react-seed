import { WorkflowNode, Connection } from '../app/Canvas/types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface Workflow {
  id: string;
  workflowId?: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: Connection[];
  metadata?: Record<string, any>;
  status?: 'draft' | 'active' | 'archived' | 'paused';
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  lastExecutedAt?: string | null;
  executionCount?: number;
}

export interface WorkflowListResponse {
  workflows: Workflow[];
  total: number;
}

export interface WorkflowCreateRequest {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: Connection[];
  metadata?: Record<string, any>;
}

export interface WorkflowUpdateRequest {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  connections?: Connection[];
  metadata?: Record<string, any>;
  status?: 'draft' | 'active' | 'archived' | 'paused';
}

/**
 * Fetch all workflows
 */
export const fetchWorkflows = async (options?: {
  status?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}): Promise<WorkflowListResponse> => {
  const params = new URLSearchParams();

  if (options?.status) params.append('status', options.status);
  if (options?.sortBy) params.append('sortBy', options.sortBy);
  if (options?.order) params.append('order', options.order);

  const response = await fetch(`${API_BASE_URL}/workflows?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch workflows');
  }

  return response.json();
};

/**
 * Fetch a single workflow by ID
 */
export const fetchWorkflow = async (id: string): Promise<Workflow> => {
  const response = await fetch(`${API_BASE_URL}/workflows/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Workflow not found');
    }
    throw new Error('Failed to fetch workflow');
  }

  return response.json();
};

/**
 * Create a new workflow
 */
export const createWorkflow = async (data: WorkflowCreateRequest): Promise<Workflow> => {
  const response = await fetch(`${API_BASE_URL}/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create workflow');
  }

  return response.json();
};

/**
 * Update an existing workflow
 */
export const updateWorkflow = async (
  id: string,
  data: WorkflowUpdateRequest
): Promise<Workflow> => {
  const response = await fetch(`${API_BASE_URL}/workflows/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Workflow not found');
    }
    throw new Error('Failed to update workflow');
  }

  return response.json();
};

/**
 * Delete a workflow
 */
export const deleteWorkflow = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/workflows/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Workflow not found');
    }
    throw new Error('Failed to delete workflow');
  }
};

/**
 * Duplicate a workflow
 */
export const duplicateWorkflow = async (id: string): Promise<Workflow> => {
  const response = await fetch(`${API_BASE_URL}/workflows/${id}/duplicate`, {
    method: 'POST',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Workflow not found');
    }
    throw new Error('Failed to duplicate workflow');
  }

  return response.json();
};

/**
 * Mark workflow as executed
 */
export const executeWorkflow = async (id: string): Promise<Workflow> => {
  const response = await fetch(`${API_BASE_URL}/workflows/${id}/execute`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Workflow not found');
    }
    throw new Error('Failed to execute workflow');
  }

  return response.json();
};

/**
 * Save current workflow state
 */
export const saveWorkflowState = async (
  workflowId: string | null,
  name: string,
  description: string,
  nodes: WorkflowNode[],
  connections: Connection[]
): Promise<Workflow> => {
  if (workflowId) {
    // Update existing workflow
    return updateWorkflow(workflowId, {
      name,
      description,
      nodes,
      connections,
    });
  } else {
    // Create new workflow
    return createWorkflow({
      name,
      description,
      nodes,
      connections,
    });
  }
};

/**
 * Load workflow state
 */
export const loadWorkflowState = async (
  id: string
): Promise<{
  nodes: WorkflowNode[];
  connections: Connection[];
  metadata: { name: string; description: string };
}> => {
  const workflow = await fetchWorkflow(id);

  return {
    nodes: workflow.nodes,
    connections: workflow.connections,
    metadata: {
      name: workflow.name,
      description: workflow.description,
    },
  };
};

/**
 * Export workflow as JSON
 */
export const exportWorkflowJSON = (
  name: string,
  description: string,
  nodes: WorkflowNode[],
  connections: Connection[]
): void => {
  const data = {
    name,
    description,
    nodes,
    connections,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/\s+/g, '-').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Import workflow from JSON file
 */
export const importWorkflowJSON = (file: File): Promise<{
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: Connection[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!data.name || !data.nodes || !data.connections) {
          throw new Error('Invalid workflow file format');
        }

        resolve({
          name: data.name,
          description: data.description || '',
          nodes: data.nodes,
          connections: data.connections,
        });
      } catch (error) {
        reject(new Error('Failed to parse workflow file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};
