export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  id: string;
  type: string;
  label: string;
  position: Position;
  size?: { width: number; height: number };
  data?: Record<string, any>;
}

export type ConnectorPosition = 'top' | 'right' | 'bottom' | 'left';

export interface Connection {
  id: string;
  source: string;
  target: string;
  sourceConnector?: ConnectorPosition;
  targetConnector?: ConnectorPosition;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'transform';
  name: string;
  description: string;
  icon?: string;
  color: string;
}

export const NODE_TYPES: WorkflowNode[] = [
  {
    id: 'experiments',
    type: 'condition',
    name: 'Experiments',
    description: 'Track and compare experiments',
    color: '#f59e0b',
  },
  {
    id: 'extensions',
    type: 'action',
    name: 'Extensions',
    description: 'Manage platform extensions',
    color: '#a855f7',
  },
  {
    id: 'feast',
    type: 'action',
    name: 'Feast',
    description: 'Feature store management',
    color: '#22c55e',
  },
  {
    id: 'hardware-profiles',
    type: 'action',
    name: 'Hardware Profiles',
    description: 'Configure hardware resources',
    color: '#f97316',
  },
  {
    id: 'mcp-servers',
    type: 'action',
    name: 'MCP Servers',
    description: 'Manage MCP server instances',
    color: '#0ea5e9',
  },
  {
    id: 'model-catalog',
    type: 'action',
    name: 'Model Catalog',
    description: 'Browse and manage model catalog',
    color: '#84cc16',
  },
  {
    id: 'model-registry',
    type: 'action',
    name: 'Model Registry',
    description: 'Register and version models',
    color: '#06b6d4',
  },
  {
    id: 'model-serving',
    type: 'action',
    name: 'Model Serving',
    description: 'Deploy and serve ML models',
    color: '#ef4444',
  },
  {
    id: 'notebooks',
    type: 'action',
    name: 'Notebooks',
    description: 'Create and manage Jupyter notebooks',
    color: '#ec4899',
  },
  {
    id: 'pipelines',
    type: 'action',
    name: 'Pipelines',
    description: 'Create and run ML pipelines',
    color: '#8b5cf6',
  },
  {
    id: 'training',
    type: 'action',
    name: 'Training',
    description: 'Train machine learning models',
    color: '#14b8a6',
  },
  {
    id: 'tuning',
    type: 'action',
    name: 'Tuning',
    description: 'Hyperparameter tuning and optimization',
    color: '#f43f5e',
  },
  {
    id: 'telemetry',
    type: 'action',
    name: 'Telemetry',
    description: 'Monitor system and workflow metrics',
    color: '#06b6d4',
  },
];

// Helm resource types (1:1 with Helm template files)
export type HelmResourceType =
  | 'oci-secret'
  | 'serving-runtime'
  | 'inference-service'
  | 'pvc'
  | 'rbac'
  | 'notebook'
  | 'job';

// Config shapes per resource type
export interface HelmGlobalValues {
  namespace: string;
  chartName: string;
  chartVersion: string;
  appVersion: string;
}

export interface HelmNodeConfig {
  resourceType: HelmResourceType;
  values: Record<string, any>;
}

// Helm-specific node types for Kubernetes resources
export const HELM_NODE_TYPES: WorkflowNode[] = [
  {
    id: 'oci-secret',
    type: 'action',
    name: 'OCI Secret',
    description: 'Stores OCI model URI as a K8s Secret',
    color: '#f59e0b',
  },
  {
    id: 'serving-runtime',
    type: 'action',
    name: 'ServingRuntime',
    description: 'vLLM GPU runtime definition (KServe)',
    color: '#ef4444',
  },
  {
    id: 'inference-service',
    type: 'action',
    name: 'InferenceService',
    description: 'Model deployment with KServe',
    color: '#8b5cf6',
  },
  {
    id: 'pvc',
    type: 'action',
    name: 'PVC',
    description: 'Persistent storage for workbench',
    color: '#06b6d4',
  },
  {
    id: 'rbac',
    type: 'action',
    name: 'RBAC',
    description: 'ServiceAccount + Role + RoleBinding',
    color: '#f97316',
  },
  {
    id: 'notebook',
    type: 'action',
    name: 'Notebook',
    description: 'Kubeflow Jupyter notebook workbench',
    color: '#ec4899',
  },
  {
    id: 'job',
    type: 'action',
    name: 'Clone Job',
    description: 'Git clone job into notebook pod',
    color: '#22c55e',
  },
];
