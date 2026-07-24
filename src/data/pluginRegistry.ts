// ---------------------------------------------------------------------------
// Types mirroring the real plugin.yaml spec and community-plugins-admin BFF
// See: rh-ai-community-plugins/charter/docs/plugin-spec.md
// See: rh-ai-community-plugins/community-plugins-admin/bff/src/types/catalog.ts
// ---------------------------------------------------------------------------

export interface PluginMaintainer {
  name: string;
  github: string;
}

export interface PluginImage {
  repository: string;
  tag: string;
}

export interface PluginPrerequisite {
  type: 'api' | 'secret';
  name: string;
  namespace?: string;
  description: string;
}

export interface PluginInstallConfig {
  method: 'automatic' | 'assisted' | 'manual';
  helm?: {
    chartPath?: string;
    registry?: string;
  };
  prerequisites?: PluginPrerequisite[];
  instructions?: string;
}

export interface PluginRemotePath {
  type: 'route' | 'icon';
  path: string;
  extensions?: string[];
}

export interface PluginRemoteSpec {
  name: string;
  scope: string;
  remoteEntry: string;
  paths: PluginRemotePath[];
}

export interface PluginRemote {
  type: 'module-federation';
  spec: PluginRemoteSpec;
}

export interface PluginRbac {
  requiredRoles?: string[];
  clusterRoles: boolean;
}

export interface PluginSupport {
  repo: string;
  docs?: string;
  issues?: string;
}

export type PluginStatus = 'experimental' | 'stable';
export type PluginMaintenance = 'red-hat' | 'community';
export type DeploymentModel = 'per-project' | 'cluster-shared' | 'both';

export interface PluginNodeDefinition {
  type: string;
  label: string;
  color: string;
  description: string;
}

export interface Plugin {
  // --- Identity (from plugin.yaml) ---
  name: string;
  displayName: string;
  description: string;
  version: string;
  maintainer: PluginMaintainer;

  // --- Registry metadata (from charter/plugins.yaml) ---
  repo: string;
  status: PluginStatus;
  maintenance: PluginMaintenance;
  lastUpdated: string;

  // --- Compatibility ---
  rhoaiCompatibility: {
    minVersion: string;
    testedVersions: string[];
  };

  // --- Deployment ---
  deploymentModel: DeploymentModel;
  image: PluginImage;
  bffImage?: PluginImage;

  // --- Installation ---
  install: PluginInstallConfig;

  // --- Dashboard integration (Module Federation) ---
  remote: PluginRemote;

  // --- RBAC ---
  rbac: PluginRbac;

  // --- Support ---
  support: PluginSupport;

  // --- Prototype-only fields (for Workspace / Canvas integration) ---
  icon: string;
  category: 'optimization' | 'data-pipeline' | 'resource-management' | 'monitoring' | 'security' | 'integration';
  features: string[];
  nodes: PluginNodeDefinition[];
  workspaceDescription: string;
}

// ---------------------------------------------------------------------------
// Categories (kept for backward compat with Workspace / Browse UI)
// ---------------------------------------------------------------------------

export const PLUGIN_CATEGORIES: Record<string, string> = {
  'optimization': 'Model Optimization',
  'data-pipeline': 'Data Pipeline',
  'resource-management': 'Resource Management',
  'monitoring': 'Monitoring',
  'security': 'Security',
  'integration': 'Integration',
};

// ---------------------------------------------------------------------------
// Mock Data: Mix of real plugins (from rh-ai-community-plugins) + fictional
// ---------------------------------------------------------------------------

export const PLUGINS: Plugin[] = [
  // ---- Real: hello-world (reference implementation) ----
  {
    name: 'hello-world',
    displayName: 'Hello World',
    description: 'A reference implementation and scaffold plugin for the RHOAI Dashboard.',
    version: '0.4.1',
    maintainer: { name: 'Guillaume Moutier', github: 'guimou' },
    repo: 'https://github.com/rh-ai-community-plugins/hello-world',
    status: 'stable',
    maintenance: 'red-hat',
    lastUpdated: '2025-07-15',
    rhoaiCompatibility: { minVersion: '3.3.0', testedVersions: ['3.3.0', '3.4.2'] },
    deploymentModel: 'cluster-shared',
    image: { repository: 'quay.io/rh-ai-community-plugins/hello-world', tag: '0.4.1' },
    bffImage: { repository: 'quay.io/rh-ai-community-plugins/hello-world-bff', tag: '0.4.1' },
    install: {
      method: 'automatic',
      helm: {
        chartPath: 'chart/',
        registry: 'oci://quay.io/rh-ai-community-plugins/hello-world-chart',
      },
      instructions: 'https://github.com/rh-ai-community-plugins/hello-world/blob/main/docs/deployment',
    },
    remote: {
      type: 'module-federation',
      spec: {
        name: 'helloWorld',
        scope: 'helloWorld',
        remoteEntry: 'https://<route>/remoteEntry.js',
        paths: [
          { type: 'route', path: '/hello-world', extensions: ['helloWorld/extensions'] },
          { type: 'icon', path: 'helloWorld/Icon' },
        ],
      },
    },
    rbac: { requiredRoles: [], clusterRoles: false },
    support: {
      repo: 'https://github.com/rh-ai-community-plugins/hello-world',
      docs: 'https://github.com/rh-ai-community-plugins/hello-world/tree/main/docs',
      issues: 'https://github.com/rh-ai-community-plugins/hello-world/issues',
    },
    icon: '👋',
    category: 'integration',
    features: ['User Info', 'Cluster Resources', 'Namespace Summary', 'K8s API Pass-through'],
    nodes: [
      { type: 'user-info', label: 'User Info', color: '#6366f1', description: 'Display current user context' },
      { type: 'cluster-res', label: 'Cluster Resources', color: '#4f46e5', description: 'Browse cluster resources' },
      { type: 'ns-summary', label: 'Namespace Summary', color: '#818cf8', description: 'Namespace overview' },
    ],
    workspaceDescription: 'Reference plugin demonstrating dashboard API integration and K8s pass-through.',
  },

  // ---- Real: brewet ----
  {
    name: 'brewet',
    displayName: 'Brewet',
    description: 'Community plugin for brewing and managing ML experiment recipes.',
    version: '0.2.0',
    maintainer: { name: 'Guillaume Moutier', github: 'guimou' },
    repo: 'https://github.com/rh-ai-community-plugins/brewet',
    status: 'experimental',
    maintenance: 'community',
    lastUpdated: '2025-06-28',
    rhoaiCompatibility: { minVersion: '3.3.0', testedVersions: ['3.3.0'] },
    deploymentModel: 'cluster-shared',
    image: { repository: 'quay.io/rh-ai-community-plugins/brewet', tag: '0.2.0' },
    bffImage: { repository: 'quay.io/rh-ai-community-plugins/brewet-bff', tag: '0.2.0' },
    install: {
      method: 'automatic',
      helm: {
        chartPath: 'chart/',
        registry: 'oci://quay.io/rh-ai-community-plugins/brewet-chart',
      },
    },
    remote: {
      type: 'module-federation',
      spec: {
        name: 'brewet',
        scope: 'brewet',
        remoteEntry: 'https://<route>/remoteEntry.js',
        paths: [
          { type: 'route', path: '/brewet', extensions: ['brewet/extensions'] },
          { type: 'icon', path: 'brewet/Icon' },
        ],
      },
    },
    rbac: { requiredRoles: [], clusterRoles: false },
    support: {
      repo: 'https://github.com/rh-ai-community-plugins/brewet',
      issues: 'https://github.com/rh-ai-community-plugins/brewet/issues',
    },
    icon: '🍺',
    category: 'data-pipeline',
    features: ['Experiment Recipes', 'Pipeline Templates', 'Batch Runs'],
    nodes: [
      { type: 'recipe', label: 'Recipe', color: '#06b6d4', description: 'Define experiment recipe' },
      { type: 'batch', label: 'Batch Run', color: '#0891b2', description: 'Execute batch experiment' },
    ],
    workspaceDescription: 'Manage ML experiment recipes and batch runs.',
  },

  // ---- Fictional (structurally accurate): Lemonade ----
  {
    name: 'lemonade',
    displayName: 'Lemonade',
    description: 'Lightweight model optimization and compression toolkit for edge deployment.',
    version: '1.2.0',
    maintainer: { name: 'Community Contributors', github: 'rh-ai-community-plugins' },
    repo: 'https://github.com/rh-ai-community-plugins/lemonade',
    status: 'stable',
    maintenance: 'community',
    lastUpdated: '2025-07-10',
    rhoaiCompatibility: { minVersion: '3.4.0', testedVersions: ['3.4.0', '3.4.2'] },
    deploymentModel: 'per-project',
    image: { repository: 'quay.io/rh-ai-community-plugins/lemonade', tag: '1.2.0' },
    install: {
      method: 'assisted',
      helm: {
        chartPath: 'chart/',
        registry: 'oci://quay.io/rh-ai-community-plugins/lemonade-chart',
      },
      prerequisites: [
        { type: 'api', name: 'serving.kserve.io/v1beta1', description: 'KServe must be installed for model export' },
      ],
      instructions: 'https://github.com/rh-ai-community-plugins/lemonade/blob/main/docs/INSTALL.md',
    },
    remote: {
      type: 'module-federation',
      spec: {
        name: 'lemonade',
        scope: 'lemonade',
        remoteEntry: 'https://<route>/remoteEntry.js',
        paths: [
          { type: 'route', path: '/lemonade', extensions: ['lemonade/extensions'] },
          { type: 'icon', path: 'lemonade/Icon' },
        ],
      },
    },
    rbac: { requiredRoles: [], clusterRoles: false },
    support: {
      repo: 'https://github.com/rh-ai-community-plugins/lemonade',
      docs: 'https://github.com/rh-ai-community-plugins/lemonade/tree/main/docs',
      issues: 'https://github.com/rh-ai-community-plugins/lemonade/issues',
    },
    icon: '🍋',
    category: 'optimization',
    features: ['Quantization', 'Pruning', 'Knowledge Distillation', 'Edge Export'],
    nodes: [
      { type: 'quantize', label: 'Quantize', color: '#8b5cf6', description: 'Reduce model precision for faster inference' },
      { type: 'prune', label: 'Prune', color: '#a855f7', description: 'Remove redundant weights from the model' },
      { type: 'distill', label: 'Distill', color: '#c084fc', description: 'Transfer knowledge to a smaller student model' },
    ],
    workspaceDescription: 'Upload models, run optimization strategies, and download compressed artifacts.',
  },

  // ---- Fictional (structurally accurate): Gatorade ----
  {
    name: 'gatorade',
    displayName: 'Gatorade',
    description: 'High-performance data hydration and pipeline accelerator.',
    version: '2.0.1',
    maintainer: { name: 'Community Contributors', github: 'rh-ai-community-plugins' },
    repo: 'https://github.com/rh-ai-community-plugins/gatorade',
    status: 'stable',
    maintenance: 'community',
    lastUpdated: '2025-07-12',
    rhoaiCompatibility: { minVersion: '3.3.0', testedVersions: ['3.3.0', '3.4.0'] },
    deploymentModel: 'both',
    image: { repository: 'quay.io/rh-ai-community-plugins/gatorade', tag: '2.0.1' },
    bffImage: { repository: 'quay.io/rh-ai-community-plugins/gatorade-bff', tag: '2.0.1' },
    install: {
      method: 'automatic',
      helm: {
        chartPath: 'chart/',
        registry: 'oci://quay.io/rh-ai-community-plugins/gatorade-chart',
      },
    },
    remote: {
      type: 'module-federation',
      spec: {
        name: 'gatorade',
        scope: 'gatorade',
        remoteEntry: 'https://<route>/remoteEntry.js',
        paths: [
          { type: 'route', path: '/gatorade', extensions: ['gatorade/extensions'] },
          { type: 'icon', path: 'gatorade/Icon' },
        ],
      },
    },
    rbac: { requiredRoles: [], clusterRoles: false },
    support: {
      repo: 'https://github.com/rh-ai-community-plugins/gatorade',
      issues: 'https://github.com/rh-ai-community-plugins/gatorade/issues',
    },
    icon: '⚡',
    category: 'data-pipeline',
    features: ['Data Streaming', 'Smart Caching', 'Auto-scaling', 'Multi-source Connectors'],
    nodes: [
      { type: 'stream', label: 'Stream Data', color: '#06b6d4', description: 'Ingest live data streams into pipelines' },
      { type: 'cache', label: 'Cache', color: '#0891b2', description: 'Smart cache layer for training data' },
      { type: 'transform', label: 'Transform', color: '#22d3ee', description: 'Apply transformations on the fly' },
    ],
    workspaceDescription: 'Configure data sources, caching rules, and monitor streaming throughput.',
  },

  // ---- Fictional (structurally accurate): Powerade ----
  {
    name: 'powerade',
    displayName: 'Powerade',
    description: 'GPU resource management and training power optimizer.',
    version: '1.5.3',
    maintainer: { name: 'Community Contributors', github: 'rh-ai-community-plugins' },
    repo: 'https://github.com/rh-ai-community-plugins/powerade',
    status: 'experimental',
    maintenance: 'community',
    lastUpdated: '2025-06-20',
    rhoaiCompatibility: { minVersion: '3.4.0', testedVersions: ['3.4.0'] },
    deploymentModel: 'cluster-shared',
    image: { repository: 'quay.io/rh-ai-community-plugins/powerade', tag: '1.5.3' },
    install: {
      method: 'manual',
      instructions: 'https://github.com/rh-ai-community-plugins/powerade/blob/main/docs/INSTALL.md',
      prerequisites: [
        { type: 'api', name: 'nvidia.com/gpu', description: 'NVIDIA GPU Operator must be installed' },
        { type: 'secret', name: 'gpu-license', namespace: 'powerade', description: 'GPU fleet license credentials' },
      ],
    },
    remote: {
      type: 'module-federation',
      spec: {
        name: 'powerade',
        scope: 'powerade',
        remoteEntry: 'https://<route>/remoteEntry.js',
        paths: [
          { type: 'route', path: '/powerade', extensions: ['powerade/extensions'] },
          { type: 'icon', path: 'powerade/Icon' },
        ],
      },
    },
    rbac: {
      requiredRoles: ['gpu-fleet-admin'],
      clusterRoles: true,
    },
    support: {
      repo: 'https://github.com/rh-ai-community-plugins/powerade',
      docs: 'https://github.com/rh-ai-community-plugins/powerade/tree/main/docs',
      issues: 'https://github.com/rh-ai-community-plugins/powerade/issues',
    },
    icon: '🔋',
    category: 'resource-management',
    features: ['GPU Scheduling', 'Cost Analytics', 'Power Monitoring', 'Auto-throttle'],
    nodes: [
      { type: 'gpu-allocate', label: 'GPU Allocate', color: '#f59e0b', description: 'Request GPU resources for workloads' },
      { type: 'throttle', label: 'Throttle', color: '#d97706', description: 'Auto-throttle based on thermal limits' },
      { type: 'monitor', label: 'Monitor', color: '#fbbf24', description: 'Track GPU utilization and power draw' },
    ],
    workspaceDescription: 'Manage GPU fleet, scheduling policies, and power/cost dashboards.',
  },

  // ---- Fictional (structurally accurate): Sentinel ----
  {
    name: 'sentinel',
    displayName: 'Sentinel',
    description: 'Real-time model drift detection and performance monitoring.',
    version: '1.0.4',
    maintainer: { name: 'Community Contributors', github: 'rh-ai-community-plugins' },
    repo: 'https://github.com/rh-ai-community-plugins/sentinel',
    status: 'experimental',
    maintenance: 'community',
    lastUpdated: '2025-05-30',
    rhoaiCompatibility: { minVersion: '3.3.0', testedVersions: ['3.3.0', '3.4.0'] },
    deploymentModel: 'cluster-shared',
    image: { repository: 'quay.io/rh-ai-community-plugins/sentinel', tag: '1.0.4' },
    install: {
      method: 'assisted',
      helm: {
        chartPath: 'chart/',
        registry: 'oci://quay.io/rh-ai-community-plugins/sentinel-chart',
      },
      instructions: 'https://github.com/rh-ai-community-plugins/sentinel/blob/main/docs/INSTALL.md',
    },
    remote: {
      type: 'module-federation',
      spec: {
        name: 'sentinel',
        scope: 'sentinel',
        remoteEntry: 'https://<route>/remoteEntry.js',
        paths: [
          { type: 'route', path: '/sentinel', extensions: ['sentinel/extensions'] },
          { type: 'icon', path: 'sentinel/Icon' },
        ],
      },
    },
    rbac: { requiredRoles: [], clusterRoles: false },
    support: {
      repo: 'https://github.com/rh-ai-community-plugins/sentinel',
      issues: 'https://github.com/rh-ai-community-plugins/sentinel/issues',
    },
    icon: '🛡️',
    category: 'monitoring',
    features: ['Drift Detection', 'Alerting', 'Performance Dashboards', 'Retrain Triggers'],
    nodes: [
      { type: 'drift-check', label: 'Drift Check', color: '#10b981', description: 'Detect data and concept drift' },
      { type: 'alert-rule', label: 'Alert Rule', color: '#059669', description: 'Define alerting conditions' },
      { type: 'dashboard', label: 'Dashboard', color: '#34d399', description: 'Embed monitoring dashboard' },
    ],
    workspaceDescription: 'Configure drift rules, view alerts, and set retrain thresholds.',
  },

  // ---- Fictional (structurally accurate): Vault ML ----
  {
    name: 'vault-ml',
    displayName: 'Vault ML',
    description: 'Model and data security with access control and audit trails.',
    version: '0.9.2',
    maintainer: { name: 'Community Contributors', github: 'rh-ai-community-plugins' },
    repo: 'https://github.com/rh-ai-community-plugins/vault-ml',
    status: 'experimental',
    maintenance: 'community',
    lastUpdated: '2025-06-05',
    rhoaiCompatibility: { minVersion: '3.4.0', testedVersions: ['3.4.0'] },
    deploymentModel: 'cluster-shared',
    image: { repository: 'quay.io/rh-ai-community-plugins/vault-ml', tag: '0.9.2' },
    bffImage: { repository: 'quay.io/rh-ai-community-plugins/vault-ml-bff', tag: '0.9.2' },
    install: {
      method: 'assisted',
      helm: {
        chartPath: 'chart/',
        registry: 'oci://quay.io/rh-ai-community-plugins/vault-ml-chart',
      },
      prerequisites: [
        { type: 'secret', name: 'vault-ml-signing-key', namespace: 'vault-ml', description: 'GPG signing key for model signatures' },
      ],
    },
    remote: {
      type: 'module-federation',
      spec: {
        name: 'vaultMl',
        scope: 'vaultMl',
        remoteEntry: 'https://<route>/remoteEntry.js',
        paths: [
          { type: 'route', path: '/vault-ml', extensions: ['vaultMl/extensions'] },
          { type: 'icon', path: 'vaultMl/Icon' },
        ],
      },
    },
    rbac: {
      requiredRoles: ['vault-ml-admin'],
      clusterRoles: false,
    },
    support: {
      repo: 'https://github.com/rh-ai-community-plugins/vault-ml',
      docs: 'https://github.com/rh-ai-community-plugins/vault-ml/tree/main/docs',
      issues: 'https://github.com/rh-ai-community-plugins/vault-ml/issues',
    },
    icon: '🔐',
    category: 'security',
    features: ['Access Control', 'Encryption', 'Model Signing', 'Audit Logging'],
    nodes: [
      { type: 'encrypt', label: 'Encrypt', color: '#ef4444', description: 'Encrypt model artifacts at rest' },
      { type: 'sign', label: 'Sign Model', color: '#dc2626', description: 'Cryptographically sign model versions' },
      { type: 'audit', label: 'Audit', color: '#f87171', description: 'Log access and changes to ML assets' },
    ],
    workspaceDescription: 'Manage access policies, audit logs, and model signing.',
  },

  // ---- Fictional (structurally accurate): Bridge ----
  {
    name: 'bridge',
    displayName: 'Bridge',
    description: 'Connect external ML platforms and model registries seamlessly.',
    version: '1.1.0',
    maintainer: { name: 'Community Contributors', github: 'rh-ai-community-plugins' },
    repo: 'https://github.com/rh-ai-community-plugins/bridge',
    status: 'stable',
    maintenance: 'community',
    lastUpdated: '2025-07-08',
    rhoaiCompatibility: { minVersion: '3.3.0', testedVersions: ['3.3.0', '3.4.0', '3.4.2'] },
    deploymentModel: 'both',
    image: { repository: 'quay.io/rh-ai-community-plugins/bridge', tag: '1.1.0' },
    bffImage: { repository: 'quay.io/rh-ai-community-plugins/bridge-bff', tag: '1.1.0' },
    install: {
      method: 'automatic',
      helm: {
        chartPath: 'chart/',
        registry: 'oci://quay.io/rh-ai-community-plugins/bridge-chart',
      },
    },
    remote: {
      type: 'module-federation',
      spec: {
        name: 'bridge',
        scope: 'bridge',
        remoteEntry: 'https://<route>/remoteEntry.js',
        paths: [
          { type: 'route', path: '/bridge', extensions: ['bridge/extensions'] },
          { type: 'icon', path: 'bridge/Icon' },
        ],
      },
    },
    rbac: { requiredRoles: [], clusterRoles: false },
    support: {
      repo: 'https://github.com/rh-ai-community-plugins/bridge',
      docs: 'https://github.com/rh-ai-community-plugins/bridge/tree/main/docs',
      issues: 'https://github.com/rh-ai-community-plugins/bridge/issues',
    },
    icon: '🌉',
    category: 'integration',
    features: ['MLflow Sync', 'W&B Integration', 'HuggingFace Import', 'SageMaker Bridge'],
    nodes: [
      { type: 'import', label: 'Import Model', color: '#6366f1', description: 'Import models from external registries' },
      { type: 'export', label: 'Export Experiment', color: '#4f46e5', description: 'Push experiments to external tools' },
      { type: 'sync', label: 'Sync', color: '#818cf8', description: 'Bidirectional platform sync' },
    ],
    workspaceDescription: 'Connect external platforms and trigger import/export sync.',
  },
];

// ---------------------------------------------------------------------------
// Helpers (backward-compatible)
// ---------------------------------------------------------------------------

export const getPluginById = (id: string): Plugin | undefined =>
  PLUGINS.find((p) => p.name === id);

export const getPluginsByCategory = (category: string): Plugin[] =>
  PLUGINS.filter((p) => p.category === category);

// ---------------------------------------------------------------------------
// Lifecycle state (simulated — mirrors BFF LifecycleStep + LifecycleResponse)
// ---------------------------------------------------------------------------

export type PluginLifecycleState =
  | 'available'
  | 'installing'
  | 'installed'
  | 'enabled'
  | 'enabling'
  | 'disabling'
  | 'disabled'
  | 'upgrading'
  | 'removing'
  | 'failed';

export interface LifecycleStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface PluginState {
  pluginName: string;
  lifecycleState: PluginLifecycleState;
  namespace?: string;
  installedVersion?: string;
  steps?: LifecycleStep[];
  error?: string;
}

const PLUGIN_STATES_KEY = 'pluginStates';
export const PLUGIN_STATE_EVENT = 'plugin-state-changed';

export const getPluginStates = (): Record<string, PluginState> => {
  try {
    const raw = localStorage.getItem(PLUGIN_STATES_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const getPluginState = (pluginName: string): PluginState | undefined => {
  return getPluginStates()[pluginName];
};

export const setPluginState = (state: PluginState): void => {
  const all = getPluginStates();
  all[state.pluginName] = state;
  localStorage.setItem(PLUGIN_STATES_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event(PLUGIN_STATE_EVENT));
};

export const removePluginState = (pluginName: string): void => {
  const all = getPluginStates();
  delete all[pluginName];
  localStorage.setItem(PLUGIN_STATES_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event(PLUGIN_STATE_EVENT));
};

export const isPluginInstalled = (pluginName: string): boolean => {
  const state = getPluginState(pluginName);
  return !!state && ['installed', 'enabled', 'disabled'].includes(state.lifecycleState);
};

export const isPluginEnabled = (pluginName: string): boolean => {
  const state = getPluginState(pluginName);
  return !!state && state.lifecycleState === 'enabled';
};

export const getInstalledPlugins = (): Plugin[] => {
  const states = getPluginStates();
  return PLUGINS.filter((p) => {
    const s = states[p.name];
    return s && ['installed', 'enabled', 'disabled'].includes(s.lifecycleState);
  });
};

export const getEnabledPlugins = (): Plugin[] => {
  const states = getPluginStates();
  return PLUGINS.filter((p) => states[p.name]?.lifecycleState === 'enabled');
};

// ---------------------------------------------------------------------------
// Simulated lifecycle operations (mirrors BFF lifecycleService.ts)
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function createStep(id: string, label: string): LifecycleStep {
  return { id, label, status: 'pending' };
}

async function runSteps(
  pluginName: string,
  steps: LifecycleStep[],
  duringState: PluginLifecycleState,
  finalState: PluginLifecycleState,
  extraState?: Partial<PluginState>,
): Promise<{ success: boolean; steps: LifecycleStep[] }> {
  const base: PluginState = {
    pluginName,
    lifecycleState: duringState,
    steps: [...steps],
    ...extraState,
  };
  setPluginState(base);

  for (const step of steps) {
    step.status = 'running';
    setPluginState({ ...base, steps: [...steps] });
    await delay(600 + Math.random() * 400);
    step.status = 'completed';
    setPluginState({ ...base, steps: [...steps] });
  }

  setPluginState({
    ...base,
    lifecycleState: finalState,
    steps: [...steps],
  });

  return { success: true, steps };
}

export async function simulateInstall(
  plugin: Plugin,
  namespace?: string,
): Promise<{ success: boolean; steps: LifecycleStep[] }> {
  const ns = namespace ?? plugin.name;
  const steps = [
    createStep('resolve', 'Resolve plugin metadata'),
    createStep('helm-install', `Install Helm chart (${plugin.install.helm?.registry ?? 'manual'})`),
    createStep('update-config', 'Register plugin in MODULE_FEDERATION_CONFIG'),
  ];

  return runSteps(plugin.name, steps, 'installing', 'enabled', {
    namespace: ns,
    installedVersion: plugin.version,
  });
}

export async function simulateUpgrade(
  plugin: Plugin,
): Promise<{ success: boolean; steps: LifecycleStep[] }> {
  const steps = [
    createStep('resolve', 'Resolve plugin metadata'),
    createStep('helm-upgrade', 'Upgrade Helm release'),
  ];

  return runSteps(plugin.name, steps, 'upgrading', 'enabled', {
    installedVersion: plugin.version,
  });
}

export async function simulateEnable(
  plugin: Plugin,
): Promise<{ success: boolean; steps: LifecycleStep[] }> {
  const steps = [
    createStep('resolve', 'Resolve plugin metadata'),
    createStep('enable', 'Add plugin to MODULE_FEDERATION_CONFIG'),
  ];

  return runSteps(plugin.name, steps, 'enabling', 'enabled');
}

export async function simulateDisable(
  plugin: Plugin,
): Promise<{ success: boolean; steps: LifecycleStep[] }> {
  const steps = [
    createStep('disable', 'Remove plugin from MODULE_FEDERATION_CONFIG'),
  ];

  return runSteps(plugin.name, steps, 'disabling', 'disabled');
}

export async function simulateRemove(
  plugin: Plugin,
  deleteNamespace = false,
): Promise<{ success: boolean; steps: LifecycleStep[] }> {
  const steps = [
    createStep('remove-config', 'Remove plugin from dashboard config'),
    createStep('helm-uninstall', 'Uninstall Helm release'),
  ];
  if (deleteNamespace) {
    steps.push(createStep('delete-ns', 'Delete namespace'));
  }

  const result = await runSteps(plugin.name, steps, 'removing', 'available');
  removePluginState(plugin.name);
  return result;
}

// ---------------------------------------------------------------------------
// Module Federation config simulation
// ---------------------------------------------------------------------------

export interface ModuleFederationEntry {
  name: string;
  backend?: {
    remoteEntry: string;
    tls: boolean;
    service: { name: string; namespace: string; port: number };
  };
  proxyService?: {
    path: string;
    pathRewrite: string;
    authorize: boolean;
    tls: boolean;
    service: { name: string; namespace: string; port: number };
  }[];
}

export const buildMFEntry = (plugin: Plugin, namespace?: string): ModuleFederationEntry => {
  const ns = namespace ?? plugin.name;
  const entry: ModuleFederationEntry = {
    name: plugin.remote.spec.name,
    backend: {
      remoteEntry: '/remoteEntry.js',
      tls: false,
      service: { name: plugin.name, namespace: ns, port: 8080 },
    },
  };

  if (plugin.bffImage) {
    const routePath = plugin.remote.spec.paths.find((p) => p.type === 'route')?.path ?? `/${plugin.name}`;
    entry.proxyService = [{
      path: `${routePath}/api`,
      pathRewrite: '/api',
      authorize: true,
      tls: false,
      service: { name: `${plugin.name}-bff`, namespace: ns, port: 3000 },
    }];
  }

  return entry;
};

export const getSimulatedMFConfig = (): ModuleFederationEntry[] => {
  const states = getPluginStates();
  return PLUGINS
    .filter((p) => states[p.name]?.lifecycleState === 'enabled')
    .map((p) => buildMFEntry(p, states[p.name]?.namespace));
};

// ---------------------------------------------------------------------------
// Backward-compatibility aliases for Workspace / Canvas / legacy code
// ---------------------------------------------------------------------------

export const DEPLOYED_PLUGINS_KEY = 'deployedPlugins';
export const LEGACY_INSTALLED_PLUGINS_KEY = 'installedPlugins';
export const PLUGIN_DEPLOYED_EVENT = PLUGIN_STATE_EVENT;
export const PLUGIN_CANVAS_PROJECT_NAME_KEY = 'pluginCanvasProjectName';
export const DEFAULT_PLUGIN_CANVAS_PROJECT = 'Plugin Workflows';

const SCHEMA_VERSION_KEY = 'pluginSchemaVersion';
const CURRENT_SCHEMA_VERSION = '2';

export const resetPluginStorage = (): void => {
  localStorage.removeItem(DEPLOYED_PLUGINS_KEY);
  localStorage.removeItem(LEGACY_INSTALLED_PLUGINS_KEY);
  localStorage.removeItem(PLUGIN_STATES_KEY);
  localStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION);
};

const migrateOrResetStorage = (): void => {
  try {
    const version = localStorage.getItem(SCHEMA_VERSION_KEY);
    if (version === CURRENT_SCHEMA_VERSION) return;

    // Wipe all old-format data — clean slate for v2 schema
    localStorage.removeItem(DEPLOYED_PLUGINS_KEY);
    localStorage.removeItem(LEGACY_INSTALLED_PLUGINS_KEY);
    localStorage.removeItem(PLUGIN_STATES_KEY);
    localStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION);
  } catch {
    // ignore migration errors
  }
};

migrateOrResetStorage();

export const getDeployedPluginIds = (): string[] => {
  const states = getPluginStates();
  return Object.keys(states).filter((name) =>
    ['installed', 'enabled', 'disabled'].includes(states[name].lifecycleState),
  );
};

export const setDeployedPluginIds = (ids: string[]): void => {
  const states = getPluginStates();
  const currentInstalled = new Set(getDeployedPluginIds());

  for (const id of ids) {
    if (!currentInstalled.has(id)) {
      const plugin = getPluginById(id);
      setPluginState({
        pluginName: id,
        lifecycleState: 'enabled',
        installedVersion: plugin?.version,
        namespace: id,
      });
    }
  }

  for (const id of currentInstalled) {
    if (!ids.includes(id)) {
      removePluginState(id);
    }
  }
};

export const getDeployedPlugins = (): Plugin[] => getInstalledPlugins();

export const getPluginCanvasProjectName = (): string => {
  try {
    return localStorage.getItem(PLUGIN_CANVAS_PROJECT_NAME_KEY) || DEFAULT_PLUGIN_CANVAS_PROJECT;
  } catch {
    return DEFAULT_PLUGIN_CANVAS_PROJECT;
  }
};

export const setPluginCanvasProjectName = (name: string): void => {
  localStorage.setItem(PLUGIN_CANVAS_PROJECT_NAME_KEY, name);
};

export const getPluginWorkspacePath = (pluginName: string): string =>
  `/plugins/${pluginName}/workspace`;

export const toCanvasProjectSlug = (displayName: string): string =>
  displayName.toLowerCase().replace(/\s+/g, '-');
