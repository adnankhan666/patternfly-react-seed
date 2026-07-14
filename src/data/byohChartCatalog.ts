import { WorkflowTemplate, getTemplatesByCategory } from './workflowTemplates';

export interface BYOHChartEntry extends WorkflowTemplate {
  popular?: boolean;
  chartRepo?: string;
  chartName?: string;
}

const EXISTING_HELM_QUICKSTARTS = getTemplatesByCategory('helm-quickstart').map((template) => ({
  ...template,
  popular: template.id === 'whisper-speech-to-text',
}));

const NEW_BYOH_CHARTS: BYOHChartEntry[] = [
  {
    id: 'triton-inference-server',
    name: 'NVIDIA Triton Inference Server',
    description: 'High-performance model serving with GPU acceleration for production inference workloads',
    category: 'helm-quickstart',
    icon: '⚡',
    popular: true,
    chartRepo: 'https://helm.ngc.nvidia.com/nvidia',
    chartName: 'tritoninferenceserver',
    nodes: [
      {
        id: 'node-model-store',
        type: 'pvc',
        label: 'Model Store PVC',
        position: { x: 100, y: 100 },
        data: {
          color: '#06b6d4',
          description: 'Persistent model storage',
          helmConfig: {
            resourceType: 'pvc',
            values: {
              name: 'triton-model-store',
              size: '50Gi',
              storageClassName: 'gp3-csi',
              accessMode: 'ReadWriteOnce',
            },
          },
        },
      },
      {
        id: 'node-serving-runtime',
        type: 'serving-runtime',
        label: 'Triton Runtime',
        position: { x: 400, y: 100 },
        data: {
          color: '#ef4444',
          description: 'NVIDIA Triton serving runtime',
          helmConfig: {
            resourceType: 'serving-runtime',
            values: {
              name: 'triton-inference',
              imageRepo: 'nvcr.io/nvidia/tritonserver',
              imageTag: '24.01-py3',
              imagePullPolicy: 'IfNotPresent',
              port: 8000,
              runtimeVersion: '24.01',
            },
          },
        },
      },
      {
        id: 'node-inference-service',
        type: 'inference-service',
        label: 'InferenceService',
        position: { x: 250, y: 300 },
        data: {
          color: '#8b5cf6',
          description: 'Triton model deployment',
          helmConfig: {
            resourceType: 'inference-service',
            values: {
              name: 'triton-inference',
              runtime: 'triton-inference',
              modelFormat: 'Triton',
              storageUri: 's3://my-models/triton-repo',
              cpuRequest: '4',
              memoryRequest: '16Gi',
              gpuRequest: '1',
              cpuLimit: '8',
              memoryLimit: '32Gi',
              gpuLimit: '1',
              minReplicas: 1,
              maxReplicas: 3,
            },
          },
        },
      },
    ],
    connections: [
      { id: 'conn-1', source: 'node-model-store', target: 'node-inference-service', sourceConnector: 'bottom', targetConnector: 'top' },
      { id: 'conn-2', source: 'node-serving-runtime', target: 'node-inference-service', sourceConnector: 'bottom', targetConnector: 'top' },
    ],
  },
  {
    id: 'ray-cluster',
    name: 'Ray Cluster',
    description: 'Distributed training and serving with Ray — scale ML workloads across multiple nodes',
    category: 'helm-quickstart',
    icon: '🔆',
    popular: true,
    chartRepo: 'https://ray-project.github.io/kuberay-helm/',
    chartName: 'ray-cluster',
    nodes: [
      {
        id: 'node-ray-head',
        type: 'training',
        label: 'Ray Head Node',
        position: { x: 250, y: 100 },
        data: {
          color: '#8b5cf6',
          description: 'Ray cluster head',
          helmConfig: {
            resourceType: 'ray-head',
            values: {
              name: 'ray-head',
              cpuRequest: '4',
              memoryRequest: '8Gi',
              cpuLimit: '8',
              memoryLimit: '16Gi',
              replicas: 1,
            },
          },
        },
      },
      {
        id: 'node-ray-worker-1',
        type: 'training',
        label: 'Ray Worker 1',
        position: { x: 100, y: 300 },
        data: {
          color: '#8b5cf6',
          description: 'GPU worker node',
          helmConfig: {
            resourceType: 'ray-worker',
            values: {
              name: 'ray-worker-1',
              cpuRequest: '8',
              memoryRequest: '16Gi',
              gpuRequest: '1',
              cpuLimit: '16',
              memoryLimit: '32Gi',
              gpuLimit: '1',
            },
          },
        },
      },
      {
        id: 'node-ray-worker-2',
        type: 'training',
        label: 'Ray Worker 2',
        position: { x: 400, y: 300 },
        data: {
          color: '#8b5cf6',
          description: 'GPU worker node',
          helmConfig: {
            resourceType: 'ray-worker',
            values: {
              name: 'ray-worker-2',
              cpuRequest: '8',
              memoryRequest: '16Gi',
              gpuRequest: '1',
              cpuLimit: '16',
              memoryLimit: '32Gi',
              gpuLimit: '1',
            },
          },
        },
      },
    ],
    connections: [
      { id: 'conn-1', source: 'node-ray-head', target: 'node-ray-worker-1', sourceConnector: 'bottom', targetConnector: 'top' },
      { id: 'conn-2', source: 'node-ray-head', target: 'node-ray-worker-2', sourceConnector: 'bottom', targetConnector: 'top' },
    ],
  },
  {
    id: 'jupyterhub',
    name: 'JupyterHub',
    description: 'Multi-user Jupyter notebook environment for collaborative data science and ML exploration',
    category: 'helm-quickstart',
    icon: '📓',
    chartRepo: 'https://hub.jupyter.org/helm-chart/',
    chartName: 'jupyterhub',
    nodes: [
      {
        id: 'node-hub',
        type: 'notebook',
        label: 'JupyterHub Hub',
        position: { x: 250, y: 100 },
        data: {
          color: '#ec4899',
          description: 'Hub controller',
          helmConfig: {
            resourceType: 'jupyterhub',
            values: {
              name: 'jupyterhub',
              cpuRequest: '2',
              memoryRequest: '4Gi',
              cpuLimit: '4',
              memoryLimit: '8Gi',
            },
          },
        },
      },
      {
        id: 'node-user-pvc',
        type: 'pvc',
        label: 'User Storage PVC',
        position: { x: 100, y: 300 },
        data: {
          color: '#06b6d4',
          description: 'Per-user persistent storage',
          helmConfig: {
            resourceType: 'pvc',
            values: {
              name: 'jupyterhub-user-storage',
              size: '10Gi',
              storageClassName: 'gp3-csi',
              accessMode: 'ReadWriteOnce',
            },
          },
        },
      },
      {
        id: 'node-singleuser',
        type: 'notebook',
        label: 'Single User Notebook',
        position: { x: 400, y: 300 },
        data: {
          color: '#ec4899',
          description: 'User notebook server',
          helmConfig: {
            resourceType: 'notebook',
            values: {
              name: 'jupyter-singleuser',
              image: 'jupyter/pytorch-notebook:latest',
              cpuRequest: '2',
              memoryRequest: '4Gi',
              cpuLimit: '4',
              memoryLimit: '8Gi',
              pvcName: 'jupyterhub-user-storage',
            },
          },
        },
      },
    ],
    connections: [
      { id: 'conn-1', source: 'node-hub', target: 'node-singleuser', sourceConnector: 'bottom', targetConnector: 'top' },
      { id: 'conn-2', source: 'node-user-pvc', target: 'node-singleuser', sourceConnector: 'right', targetConnector: 'left' },
    ],
  },
];

export const BYOH_CHART_CATALOG: BYOHChartEntry[] = [
  ...EXISTING_HELM_QUICKSTARTS,
  ...NEW_BYOH_CHARTS,
];

export const getBYOHChartById = (id: string): BYOHChartEntry | undefined =>
  BYOH_CHART_CATALOG.find((chart) => chart.id === id);

export interface BYOHDeploymentRecord {
  releaseName: string;
  namespace: string;
  chartName: string;
  sourceType: 'catalog' | 'uri' | 'upload';
  sourceValue: string;
  templateId?: string;
  timestamp: string;
  status: 'deployed';
}

export const BYOH_DEPLOYMENTS_KEY = 'byoh-deployments';

export const getBYOHDeployments = (): BYOHDeploymentRecord[] => {
  try {
    return JSON.parse(localStorage.getItem(BYOH_DEPLOYMENTS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveBYOHDeployment = (record: BYOHDeploymentRecord): void => {
  const existing = getBYOHDeployments();
  const updated = [record, ...existing.filter((d) => d.releaseName !== record.releaseName)];
  localStorage.setItem(BYOH_DEPLOYMENTS_KEY, JSON.stringify(updated));
};

export type UriFormat = 'oci' | 'helm-repo' | 'git' | 'unknown';

export const detectUriFormat = (uri: string): UriFormat => {
  const trimmed = uri.trim().toLowerCase();
  if (!trimmed) return 'unknown';
  if (trimmed.startsWith('oci://')) return 'oci';
  if (trimmed.includes('github.com') || trimmed.includes('gitlab.com') || trimmed.endsWith('.git')) return 'git';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return 'helm-repo';
  return 'unknown';
};

export const uriFormatLabels: Record<UriFormat, string> = {
  oci: 'OCI',
  'helm-repo': 'Helm Repo',
  git: 'Git',
  unknown: 'Unknown',
};

export const uriFormatColors: Record<UriFormat, string> = {
  oci: 'orange',
  'helm-repo': 'blue',
  git: 'purple',
  unknown: 'grey',
};
