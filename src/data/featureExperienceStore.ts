export type FeatureDeploymentStatus = 'deploying' | 'running' | 'stopped';

export interface FeatureDeployment {
  featureId: string;
  deployedAt: string;
  status: FeatureDeploymentStatus;
  templateId: string;
  canvasProjectName?: string;
}

const STORAGE_KEY = 'deployedEarlyAccessFeatures';
export const FEATURE_EXPERIENCED_EVENT = 'feature-experienced';

function readDeployments(): FeatureDeployment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FeatureDeployment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDeployments(deployments: FeatureDeployment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deployments));
  window.dispatchEvent(new CustomEvent(FEATURE_EXPERIENCED_EVENT));
}

export function getDeployedFeatures(): FeatureDeployment[] {
  return readDeployments();
}

export function getFeatureDeployment(featureId: string): FeatureDeployment | undefined {
  return readDeployments().find((d) => d.featureId === featureId);
}

export function deployFeature(
  featureId: string,
  templateId: string,
  canvasProjectName?: string
): FeatureDeployment {
  const deployments = readDeployments();
  const existing = deployments.findIndex((d) => d.featureId === featureId);
  const record: FeatureDeployment = {
    featureId,
    deployedAt: new Date().toISOString(),
    status: 'deploying',
    templateId,
    canvasProjectName,
  };
  if (existing >= 0) {
    deployments[existing] = { ...deployments[existing], ...record };
  } else {
    deployments.push(record);
  }
  writeDeployments(deployments);
  return record;
}

export function updateFeatureDeploymentStatus(
  featureId: string,
  status: FeatureDeploymentStatus,
  canvasProjectName?: string
): FeatureDeployment | undefined {
  const deployments = readDeployments();
  const index = deployments.findIndex((d) => d.featureId === featureId);
  if (index < 0) return undefined;
  deployments[index] = {
    ...deployments[index],
    status,
    ...(canvasProjectName !== undefined ? { canvasProjectName } : {}),
  };
  writeDeployments(deployments);
  return deployments[index];
}

export function removeFeatureDeployment(featureId: string): void {
  writeDeployments(readDeployments().filter((d) => d.featureId !== featureId));
}

export function isFeatureDeployed(featureId: string): boolean {
  const deployment = getFeatureDeployment(featureId);
  return Boolean(deployment && deployment.status !== 'stopped');
}
