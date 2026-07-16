import { DEPLOYMENT_PHASES } from '../types/deploymentPhases';
import { NodeDeploymentStatus } from '../types/deploymentPhases';

type DeploymentState = NodeDeploymentStatus['state'];

const NODE_DESCRIPTIONS: Record<string, Partial<Record<number, Partial<Record<DeploymentState, string>>>>> = {
  'pvc': {
    [DEPLOYMENT_PHASES.VALIDATE]: {
      validating: 'Checking that storage is available in your cluster before creating a volume.',
    },
    [DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE]: {
      deploying: 'Creating persistent storage for your workbench — this keeps notebooks and data safe across restarts.',
      ready: 'Storage is ready. Your project files will be saved even if pods restart.',
    },
    [DEPLOYMENT_PHASES.HEALTH_CHECKS]: {
      deploying: 'Verifying the storage volume is bound and accessible to your workloads.',
      ready: 'Storage health check passed — your volume is mounted and ready.',
    },
  },
  'rbac': {
    [DEPLOYMENT_PHASES.VALIDATE]: {
      validating: 'Reviewing permissions needed for services in your namespace.',
    },
    [DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE]: {
      deploying: 'Setting up access rules so notebooks, jobs, and services can work together securely.',
      ready: 'Permissions configured — workloads can access what they need without over-privileging.',
    },
  },
  'oci-secret': {
    [DEPLOYMENT_PHASES.VALIDATE]: {
      validating: 'Validating model registry credentials and image pull settings.',
    },
    [DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE]: {
      deploying: 'Creating a secure secret to pull your model artifacts from the registry.',
      ready: 'Registry secret stored — model images can now be pulled into the cluster.',
    },
  },
  'serving-runtime': {
    [DEPLOYMENT_PHASES.VALIDATE]: {
      validating: 'Checking runtime configuration and accelerator availability.',
    },
    [DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE]: {
      deploying: 'Provisioning the inference runtime that will host your model server.',
      ready: 'Serving runtime is ready to accept model deployments.',
    },
  },
  'inference-service': {
    [DEPLOYMENT_PHASES.VALIDATE]: {
      validating: 'Validating model format, runtime dependencies, and endpoint settings.',
    },
    [DEPLOYMENT_PHASES.DEPLOY_SERVICES]: {
      deploying: 'Deploying your model endpoint so applications can send inference requests.',
      ready: 'Model endpoint is live and ready to serve predictions.',
    },
    [DEPLOYMENT_PHASES.HEALTH_CHECKS]: {
      deploying: 'Checking that the model endpoint responds and is reachable inside the cluster.',
      ready: 'Health check passed — your inference service is responding normally.',
    },
  },
  'notebook': {
    [DEPLOYMENT_PHASES.VALIDATE]: {
      validating: 'Validating notebook image, CPU/memory limits, and storage attachment.',
    },
    [DEPLOYMENT_PHASES.DEPLOY_SERVICES]: {
      deploying: 'Launching your data science notebook environment for interactive work.',
      ready: 'Notebook server is running — you can open it to explore data and run code.',
    },
    [DEPLOYMENT_PHASES.HEALTH_CHECKS]: {
      deploying: 'Confirming the notebook server is reachable and ready for user sessions.',
      ready: 'Notebook health check passed — your workbench is ready to use.',
    },
  },
  'job': {
    [DEPLOYMENT_PHASES.VALIDATE]: {
      validating: 'Checking job configuration and repository access settings.',
    },
    [DEPLOYMENT_PHASES.RUN_JOBS]: {
      deploying: 'Running setup tasks such as cloning your repository and preparing the workspace.',
      ready: 'Setup job finished — your code and dependencies are ready in the environment.',
    },
  },
};

const FALLBACK_DESCRIPTIONS: Partial<Record<DeploymentState, string>> = {
  validating: 'Running pre-flight checks on this resource before deployment begins.',
  deploying: 'Applying this resource to your cluster — this may take a few moments.',
  ready: 'This resource finished successfully and is ready to use.',
  pending: 'Waiting for earlier deployment steps to complete.',
  failed: 'This resource encountered an issue during deployment.',
};

export const getNodeDeploymentDescription = (
  resourceType: string,
  phase: number,
  state: DeploymentState
): string => {
  const byResource = NODE_DESCRIPTIONS[resourceType];
  const byPhase = byResource?.[phase];
  const description = byPhase?.[state];

  if (description) return description;

  return FALLBACK_DESCRIPTIONS[state] || 'Processing deployment step for this resource.';
};

export const getPhaseName = (phase: number): string => {
  const names: Record<number, string> = {
    [DEPLOYMENT_PHASES.VALIDATE]: 'Validation',
    [DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE]: 'Infrastructure',
    [DEPLOYMENT_PHASES.DEPLOY_SERVICES]: 'Services',
    [DEPLOYMENT_PHASES.RUN_JOBS]: 'Jobs',
    [DEPLOYMENT_PHASES.HEALTH_CHECKS]: 'Health Checks',
    [DEPLOYMENT_PHASES.READY]: 'Ready',
  };
  return names[phase] || 'Deployment';
};
