export interface DeploymentPhase {
  id: number;
  name: string;
  description: string;
  duration: number; // in milliseconds
  nodeStates: Record<string, string>; // nodeId -> status message
}

export interface DeploymentLog {
  id: string;
  timestamp: Date;
  phase: number;
  nodeId?: string;
  nodeName?: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface DeploymentStatus {
  phase: number;
  totalPhases: number;
  currentPhaseProgress: number; // 0-100
  logs: DeploymentLog[];
  nodeStatuses: Map<string, NodeDeploymentStatus>;
}

export interface NodeDeploymentStatus {
  state: 'pending' | 'validating' | 'deploying' | 'ready' | 'failed';
  message: string;
  substeps: string[];
  currentSubstep?: number;
}

export const DEPLOYMENT_PHASES = {
  VALIDATE: 1,
  DEPLOY_INFRASTRUCTURE: 2,
  DEPLOY_SERVICES: 3,
  RUN_JOBS: 4,
  HEALTH_CHECKS: 5,
  READY: 6,
};

export const PHASE_DESCRIPTIONS = {
  [DEPLOYMENT_PHASES.VALIDATE]: {
    name: 'Validation',
    description: 'Pre-flight checks and configuration validation',
    icon: '🔍',
  },
  [DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE]: {
    name: 'Deploy Infrastructure',
    description: 'Creating secrets, storage, and runtime resources',
    icon: '🏗️',
  },
  [DEPLOYMENT_PHASES.DEPLOY_SERVICES]: {
    name: 'Deploy Services',
    description: 'Deploying inference service and notebook workbench',
    icon: '🚀',
  },
  [DEPLOYMENT_PHASES.RUN_JOBS]: {
    name: 'Run Jobs',
    description: 'Executing initialization jobs and setup tasks',
    icon: '⚙️',
  },
  [DEPLOYMENT_PHASES.HEALTH_CHECKS]: {
    name: 'Health Checks',
    description: 'Verifying deployment health and connectivity',
    icon: '🏥',
  },
  [DEPLOYMENT_PHASES.READY]: {
    name: 'Ready',
    description: 'Deployment complete and services available',
    icon: '✅',
  },
};

// Deployment logs per resource type
export const generateDeploymentLogs = (
  resourceType: string,
  nodeName: string,
  phase: number
): string[] => {
  const logs: Record<string, Record<number, string[]>> = {
    'oci-secret': {
      [DEPLOYMENT_PHASES.VALIDATE]: ['Validating OCI connection string', 'Checking registry access'],
      [DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE]: [
        'Creating Kubernetes Secret',
        'Storing OCI model URI',
        'Secret created successfully',
      ],
    },
    'serving-runtime': {
      [DEPLOYMENT_PHASES.VALIDATE]: ['Validating runtime configuration', 'Checking GPU availability'],
      [DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE]: [
        'Creating ServingRuntime resource',
        'Configuring vLLM container',
        'Setting up volume mounts',
        'ServingRuntime ready',
      ],
    },
    'pvc': {
      [DEPLOYMENT_PHASES.VALIDATE]: ['Checking storage class availability'],
      [DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE]: [
        'Creating PersistentVolumeClaim',
        'Requesting 20Gi storage',
        'Volume bound successfully',
      ],
    },
    'rbac': {
      [DEPLOYMENT_PHASES.VALIDATE]: ['Validating service account permissions'],
      [DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE]: [
        'Creating ServiceAccount',
        'Creating Role with pod exec permissions',
        'Binding Role to ServiceAccount',
        'RBAC configured successfully',
      ],
    },
    'inference-service': {
      [DEPLOYMENT_PHASES.VALIDATE]: ['Validating model configuration', 'Checking dependencies'],
      [DEPLOYMENT_PHASES.DEPLOY_SERVICES]: [
        'Creating InferenceService',
        'Pulling model from OCI registry',
        'Allocating GPU resources',
        'Starting vLLM server',
        'Model loading... (this may take a few minutes)',
        'Model loaded successfully',
        'Inference endpoint ready',
      ],
      [DEPLOYMENT_PHASES.HEALTH_CHECKS]: ['Testing inference endpoint', 'Endpoint responding: 200 OK'],
    },
    'notebook': {
      [DEPLOYMENT_PHASES.VALIDATE]: ['Validating notebook configuration', 'Checking dependencies'],
      [DEPLOYMENT_PHASES.DEPLOY_SERVICES]: [
        'Creating Notebook workbench',
        'Pulling notebook image',
        'Mounting persistent volume',
        'Starting Jupyter server',
        'Injecting OAuth sidecar',
        'Notebook pod running',
        'JupyterLab ready',
      ],
      [DEPLOYMENT_PHASES.HEALTH_CHECKS]: ['Checking notebook accessibility', 'Notebook responding: 200 OK'],
    },
    'job': {
      [DEPLOYMENT_PHASES.VALIDATE]: ['Validating job configuration', 'Checking git repository access'],
      [DEPLOYMENT_PHASES.RUN_JOBS]: [
        'Creating clone Job',
        'Waiting for notebook pod...',
        'Notebook pod ready',
        'Cloning repository',
        'Cloning into /opt/app-root/src',
        'Repository cloned successfully',
        'Job completed',
      ],
    },
  };

  return logs[resourceType]?.[phase] || [];
};
