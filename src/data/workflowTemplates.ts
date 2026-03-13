import { WorkflowNode, Connection } from '../app/Canvas/types';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ml-pipeline' | 'data-processing' | 'deployment' | 'monitoring' | 'helm-quickstart';
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
    data?: any;
  }>;
  connections: Connection[];
  icon?: string;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'ml-training-pipeline',
    name: 'ML Training Pipeline',
    description: 'Complete machine learning training workflow with data ingestion, preprocessing, model training, and evaluation',
    category: 'ml-pipeline',
    icon: '🤖',
    nodes: [
      {
        id: 'node-data-source',
        type: 'notebooks',
        label: 'Data Source',
        position: { x: 50, y: 200 },
        data: { color: '#06b6d4', description: 'Load and explore training data' },
      },
      {
        id: 'node-preprocessing',
        type: 'notebooks',
        label: 'Data Preprocessing',
        position: { x: 300, y: 200 },
        data: { color: '#06b6d4', description: 'Clean and transform data' },
      },
      {
        id: 'node-feature-engineering',
        type: 'notebooks',
        label: 'Feature Engineering',
        position: { x: 550, y: 200 },
        data: { color: '#06b6d4', description: 'Create and select features' },
      },
      {
        id: 'node-model-training',
        type: 'training',
        label: 'Model Training',
        position: { x: 800, y: 200 },
        data: { color: '#8b5cf6', description: 'Train ML model' },
      },
      {
        id: 'node-evaluation',
        type: 'experiments',
        label: 'Model Evaluation',
        position: { x: 1050, y: 200 },
        data: { color: '#f59e0b', description: 'Evaluate model performance' },
      },
      {
        id: 'node-registry',
        type: 'model-registry',
        label: 'Model Registry',
        position: { x: 1300, y: 200 },
        data: { color: '#10b981', description: 'Register trained model' },
      },
    ],
    connections: [
      { id: 'conn-1', source: 'node-data-source', target: 'node-preprocessing', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-2', source: 'node-preprocessing', target: 'node-feature-engineering', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-3', source: 'node-feature-engineering', target: 'node-model-training', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-4', source: 'node-model-training', target: 'node-evaluation', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-5', source: 'node-evaluation', target: 'node-registry', sourceConnector: 'right', targetConnector: 'left' },
    ],
  },
  {
    id: 'data-processing-pipeline',
    name: 'Data Processing Pipeline',
    description: 'ETL pipeline for data extraction, transformation, and loading into data warehouse',
    category: 'data-processing',
    icon: '📊',
    nodes: [
      {
        id: 'node-extract',
        type: 'pipelines',
        label: 'Extract Data',
        position: { x: 50, y: 150 },
        data: { color: '#3b82f6', description: 'Extract from data sources' },
      },
      {
        id: 'node-validate',
        type: 'pipelines',
        label: 'Validate',
        position: { x: 300, y: 100 },
        data: { color: '#3b82f6', description: 'Validate data quality' },
      },
      {
        id: 'node-transform',
        type: 'pipelines',
        label: 'Transform',
        position: { x: 300, y: 250 },
        data: { color: '#3b82f6', description: 'Transform and enrich data' },
      },
      {
        id: 'node-aggregate',
        type: 'pipelines',
        label: 'Aggregate',
        position: { x: 550, y: 175 },
        data: { color: '#3b82f6', description: 'Aggregate metrics' },
      },
      {
        id: 'node-load',
        type: 'feast',
        label: 'Load to Warehouse',
        position: { x: 800, y: 175 },
        data: { color: '#ec4899', description: 'Store in feature store' },
      },
    ],
    connections: [
      { id: 'conn-1', source: 'node-extract', target: 'node-validate', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-2', source: 'node-extract', target: 'node-transform', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-3', source: 'node-validate', target: 'node-aggregate', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-4', source: 'node-transform', target: 'node-aggregate', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-5', source: 'node-aggregate', target: 'node-load', sourceConnector: 'right', targetConnector: 'left' },
    ],
  },
  {
    id: 'model-deployment-pipeline',
    name: 'Model Deployment Pipeline',
    description: 'Complete workflow for deploying ML models to production with monitoring and A/B testing',
    category: 'deployment',
    icon: '🚀',
    nodes: [
      {
        id: 'node-registry-source',
        type: 'model-registry',
        label: 'Model Registry',
        position: { x: 50, y: 200 },
        data: { color: '#10b981', description: 'Fetch trained model' },
      },
      {
        id: 'node-validation',
        type: 'experiments',
        label: 'Validation Tests',
        position: { x: 300, y: 200 },
        data: { color: '#f59e0b', description: 'Run validation tests' },
      },
      {
        id: 'node-containerize',
        type: 'model-serving',
        label: 'Containerize',
        position: { x: 550, y: 200 },
        data: { color: '#ef4444', description: 'Package model in container' },
      },
      {
        id: 'node-deploy-staging',
        type: 'model-serving',
        label: 'Deploy to Staging',
        position: { x: 800, y: 150 },
        data: { color: '#ef4444', description: 'Deploy to staging environment' },
      },
      {
        id: 'node-ab-test',
        type: 'experiments',
        label: 'A/B Testing',
        position: { x: 1050, y: 150 },
        data: { color: '#f59e0b', description: 'Run A/B tests' },
      },
      {
        id: 'node-deploy-prod',
        type: 'model-serving',
        label: 'Deploy to Production',
        position: { x: 800, y: 250 },
        data: { color: '#ef4444', description: 'Deploy to production' },
      },
    ],
    connections: [
      { id: 'conn-1', source: 'node-registry-source', target: 'node-validation', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-2', source: 'node-validation', target: 'node-containerize', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-3', source: 'node-containerize', target: 'node-deploy-staging', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-4', source: 'node-deploy-staging', target: 'node-ab-test', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-5', source: 'node-containerize', target: 'node-deploy-prod', sourceConnector: 'right', targetConnector: 'left' },
    ],
  },
  {
    id: 'hyperparameter-tuning',
    name: 'Hyperparameter Tuning Pipeline',
    description: 'Automated hyperparameter optimization workflow with parallel training and selection',
    category: 'ml-pipeline',
    icon: '⚙️',
    nodes: [
      {
        id: 'node-data-prep',
        type: 'notebooks',
        label: 'Data Preparation',
        position: { x: 50, y: 200 },
        data: { color: '#06b6d4', description: 'Prepare training data' },
      },
      {
        id: 'node-tuning',
        type: 'tuning',
        label: 'Hyperparameter Tuning',
        position: { x: 300, y: 200 },
        data: { color: '#f97316', description: 'Optimize hyperparameters' },
      },
      {
        id: 'node-train-1',
        type: 'training',
        label: 'Training Run 1',
        position: { x: 550, y: 100 },
        data: { color: '#8b5cf6', description: 'Train with config 1' },
      },
      {
        id: 'node-train-2',
        type: 'training',
        label: 'Training Run 2',
        position: { x: 550, y: 200 },
        data: { color: '#8b5cf6', description: 'Train with config 2' },
      },
      {
        id: 'node-train-3',
        type: 'training',
        label: 'Training Run 3',
        position: { x: 550, y: 300 },
        data: { color: '#8b5cf6', description: 'Train with config 3' },
      },
      {
        id: 'node-compare',
        type: 'experiments',
        label: 'Compare Results',
        position: { x: 800, y: 200 },
        data: { color: '#f59e0b', description: 'Select best model' },
      },
      {
        id: 'node-best-model',
        type: 'model-registry',
        label: 'Register Best Model',
        position: { x: 1050, y: 200 },
        data: { color: '#10b981', description: 'Save optimal model' },
      },
    ],
    connections: [
      { id: 'conn-1', source: 'node-data-prep', target: 'node-tuning', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-2', source: 'node-tuning', target: 'node-train-1', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-3', source: 'node-tuning', target: 'node-train-2', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-4', source: 'node-tuning', target: 'node-train-3', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-5', source: 'node-train-1', target: 'node-compare', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-6', source: 'node-train-2', target: 'node-compare', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-7', source: 'node-train-3', target: 'node-compare', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-8', source: 'node-compare', target: 'node-best-model', sourceConnector: 'right', targetConnector: 'left' },
    ],
  },
  {
    id: 'monitoring-pipeline',
    name: 'Model Monitoring Pipeline',
    description: 'Production model monitoring with drift detection and automated retraining',
    category: 'monitoring',
    icon: '📈',
    nodes: [
      {
        id: 'node-prod-model',
        type: 'model-serving',
        label: 'Production Model',
        position: { x: 50, y: 200 },
        data: { color: '#ef4444', description: 'Serving model in production' },
      },
      {
        id: 'node-collect-metrics',
        type: 'experiments',
        label: 'Collect Metrics',
        position: { x: 300, y: 200 },
        data: { color: '#f59e0b', description: 'Monitor performance metrics' },
      },
      {
        id: 'node-drift-detection',
        type: 'experiments',
        label: 'Drift Detection',
        position: { x: 550, y: 150 },
        data: { color: '#f59e0b', description: 'Detect data/concept drift' },
      },
      {
        id: 'node-alerts',
        type: 'extensions',
        label: 'Alert System',
        position: { x: 800, y: 100 },
        data: { color: '#6366f1', description: 'Send alerts if drift detected' },
      },
      {
        id: 'node-retrain',
        type: 'training',
        label: 'Automated Retraining',
        position: { x: 550, y: 300 },
        data: { color: '#8b5cf6', description: 'Retrain model on new data' },
      },
      {
        id: 'node-redeploy',
        type: 'model-serving',
        label: 'Redeploy',
        position: { x: 800, y: 300 },
        data: { color: '#ef4444', description: 'Deploy updated model' },
      },
    ],
    connections: [
      { id: 'conn-1', source: 'node-prod-model', target: 'node-collect-metrics', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-2', source: 'node-collect-metrics', target: 'node-drift-detection', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-3', source: 'node-drift-detection', target: 'node-alerts', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'conn-4', source: 'node-drift-detection', target: 'node-retrain', sourceConnector: 'bottom', targetConnector: 'top' },
      { id: 'conn-5', source: 'node-retrain', target: 'node-redeploy', sourceConnector: 'right', targetConnector: 'left' },
    ],
  },
  {
    id: 'whisper-speech-to-text',
    name: 'Whisper Speech-to-Text Deployment',
    description: 'Complete Helm deployment for Whisper speech-to-text model with KServe, workbench, and git clone automation',
    category: 'helm-quickstart',
    icon: '🎤',
    nodes: [
      // Level 0 nodes (no dependencies)
      {
        id: 'node-oci-secret',
        type: 'oci-secret',
        label: 'OCI Secret',
        position: { x: 50, y: 100 },
        data: {
          color: '#f59e0b',
          description: 'Stores OCI model URI',
          helmConfig: {
            resourceType: 'oci-secret',
            values: {
              name: 'whisper-large-v3-oci',
              uri: 'oci://quay.io/redhat-ai-services/modelcar-catalog:whisper-large-v3',
              connectionType: 'uri-v1',
            },
          },
        },
      },
      {
        id: 'node-serving-runtime',
        type: 'serving-runtime',
        label: 'ServingRuntime',
        position: { x: 300, y: 100 },
        data: {
          color: '#ef4444',
          description: 'vLLM GPU runtime',
          helmConfig: {
            resourceType: 'serving-runtime',
            values: {
              name: 'whisper-large-v3',
              imageRepo: 'quay.io/vllm/vllm-cuda',
              imageTag: '0.9.2.2',
              imagePullPolicy: 'IfNotPresent',
              port: 8080,
              runtimeVersion: 'v0.9.2.2',
            },
          },
        },
      },
      {
        id: 'node-pvc',
        type: 'pvc',
        label: 'Workbench PVC',
        position: { x: 550, y: 100 },
        data: {
          color: '#06b6d4',
          description: 'Persistent storage',
          helmConfig: {
            resourceType: 'pvc',
            values: {
              name: 'whisper-workbench-storage',
              size: '20Gi',
              storageClassName: 'gp3-csi',
              accessMode: 'ReadWriteOnce',
            },
          },
        },
      },
      {
        id: 'node-rbac',
        type: 'rbac',
        label: 'RBAC',
        position: { x: 800, y: 100 },
        data: {
          color: '#f97316',
          description: 'ServiceAccount + Role',
          helmConfig: {
            resourceType: 'rbac',
            values: {
              serviceAccountName: 'whisper-workbench',
              roleName: 'whisper-workbench-pod-exec',
              roleBindingName: 'whisper-workbench-exec',
            },
          },
        },
      },
      // Level 1 nodes (depend on Level 0)
      {
        id: 'node-inference-service',
        type: 'inference-service',
        label: 'InferenceService',
        position: { x: 175, y: 300 },
        data: {
          color: '#8b5cf6',
          description: 'Model deployment',
          helmConfig: {
            resourceType: 'inference-service',
            values: {
              name: 'whisper-large-v3',
              runtime: 'whisper-large-v3',
              modelFormat: 'vLLM',
              storageUri: 'oci://quay.io/redhat-ai-services/modelcar-catalog:whisper-large-v3',
              cpuRequest: '4',
              memoryRequest: '8Gi',
              gpuRequest: '1',
              cpuLimit: '8',
              memoryLimit: '10Gi',
              gpuLimit: '1',
              minReplicas: 1,
              maxReplicas: 1,
              tolerations: [
                {
                  key: 'nvidia.com/gpu',
                  operator: 'Exists',
                  effect: 'NoSchedule',
                },
              ],
            },
          },
        },
      },
      {
        id: 'node-notebook',
        type: 'notebook',
        label: 'Workbench Notebook',
        position: { x: 675, y: 300 },
        data: {
          color: '#ec4899',
          description: 'Jupyter workbench',
          helmConfig: {
            resourceType: 'notebook',
            values: {
              name: 'whisper-workbench',
              image: 'image-registry.openshift-image-registry.svc:5000/redhat-ods-applications/s2i-generic-data-science-notebook:2025.1',
              cpuRequest: '3',
              memoryRequest: '24Gi',
              cpuLimit: '6',
              memoryLimit: '24Gi',
              pvcName: 'whisper-workbench-storage',
              serviceAccountName: 'whisper-workbench',
            },
          },
        },
      },
      // Level 2 node (depends on notebook)
      {
        id: 'node-clone-job',
        type: 'job',
        label: 'Git Clone Job',
        position: { x: 675, y: 500 },
        data: {
          color: '#22c55e',
          description: 'Clone demo repo',
          helmConfig: {
            resourceType: 'job',
            values: {
              name: 'whisper-workbench-clone-repo',
              gitRepoUrl: 'https://github.com/Sheryl-shiyi/Basic-speech-to-text-with-Whisper.git',
              notebookName: 'whisper-workbench',
              serviceAccountName: 'whisper-workbench',
              backoffLimit: 3,
            },
          },
        },
      },
    ],
    connections: [
      // Secret -> InferenceService
      { id: 'conn-1', source: 'node-oci-secret', target: 'node-inference-service', sourceConnector: 'bottom', targetConnector: 'top' },
      // ServingRuntime -> InferenceService
      { id: 'conn-2', source: 'node-serving-runtime', target: 'node-inference-service', sourceConnector: 'bottom', targetConnector: 'top' },
      // PVC -> Notebook
      { id: 'conn-3', source: 'node-pvc', target: 'node-notebook', sourceConnector: 'bottom', targetConnector: 'top' },
      // RBAC -> Notebook
      { id: 'conn-4', source: 'node-rbac', target: 'node-notebook', sourceConnector: 'bottom', targetConnector: 'top' },
      // Notebook -> Job
      { id: 'conn-5', source: 'node-notebook', target: 'node-clone-job', sourceConnector: 'bottom', targetConnector: 'top' },
    ],
  },
  {
    id: 'lightweight-ds-workbench',
    name: 'Lightweight Data Science Workbench',
    description: 'CPU-only Jupyter workbench with persistent storage and git clone — fits clusters without GPU nodes',
    category: 'helm-quickstart',
    icon: '📓',
    nodes: [
      {
        id: 'node-pvc',
        type: 'pvc',
        label: 'Workbench PVC',
        position: { x: 100, y: 100 },
        data: {
          color: '#06b6d4',
          description: '5Gi persistent storage',
          helmConfig: {
            resourceType: 'pvc',
            values: {
              name: 'ds-workbench-storage',
              size: '5Gi',
              storageClassName: 'gp3-csi',
              accessMode: 'ReadWriteOnce',
            },
          },
        },
      },
      {
        id: 'node-rbac',
        type: 'rbac',
        label: 'RBAC',
        position: { x: 400, y: 100 },
        data: {
          color: '#f97316',
          description: 'ServiceAccount + Role',
          helmConfig: {
            resourceType: 'rbac',
            values: {
              serviceAccountName: 'ds-workbench',
              roleName: 'ds-workbench-pod-exec',
              roleBindingName: 'ds-workbench-exec',
            },
          },
        },
      },
      {
        id: 'node-notebook',
        type: 'notebook',
        label: 'DS Notebook',
        position: { x: 250, y: 300 },
        data: {
          color: '#ec4899',
          description: 'Jupyter workbench (CPU)',
          helmConfig: {
            resourceType: 'notebook',
            values: {
              name: 'ds-workbench',
              image: 'image-registry.openshift-image-registry.svc:5000/redhat-ods-applications/s2i-generic-data-science-notebook:2025.1',
              cpuRequest: '1',
              memoryRequest: '4Gi',
              cpuLimit: '2',
              memoryLimit: '8Gi',
              pvcName: 'ds-workbench-storage',
              serviceAccountName: 'ds-workbench',
            },
          },
        },
      },
      {
        id: 'node-clone-job',
        type: 'job',
        label: 'Git Clone Job',
        position: { x: 250, y: 500 },
        data: {
          color: '#22c55e',
          description: 'Clone starter notebooks',
          helmConfig: {
            resourceType: 'job',
            values: {
              name: 'ds-workbench-clone-repo',
              gitRepoUrl: 'https://github.com/opendatahub-io/notebooks.git',
              notebookName: 'ds-workbench',
              serviceAccountName: 'ds-workbench',
              backoffLimit: 3,
            },
          },
        },
      },
    ],
    connections: [
      { id: 'conn-1', source: 'node-pvc', target: 'node-notebook', sourceConnector: 'bottom', targetConnector: 'top' },
      { id: 'conn-2', source: 'node-rbac', target: 'node-notebook', sourceConnector: 'bottom', targetConnector: 'top' },
      { id: 'conn-3', source: 'node-notebook', target: 'node-clone-job', sourceConnector: 'bottom', targetConnector: 'top' },
    ],
  },
];

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: WorkflowTemplate['category']): WorkflowTemplate[] => {
  return WORKFLOW_TEMPLATES.filter(template => template.category === category);
};

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  return WORKFLOW_TEMPLATES.find(template => template.id === id);
};
