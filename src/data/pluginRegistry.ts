export interface PluginNodeDefinition {
  type: string;
  label: string;
  color: string;
  description: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  version: string;
  author: string;
  category: 'optimization' | 'data-pipeline' | 'resource-management' | 'monitoring' | 'security' | 'integration';
  features: string[];
  icon: string;
  nodes: PluginNodeDefinition[];
  workspaceDescription: string;
}

export const PLUGIN_CATEGORIES: Record<string, string> = {
  'optimization': 'Model Optimization',
  'data-pipeline': 'Data Pipeline',
  'resource-management': 'Resource Management',
  'monitoring': 'Monitoring',
  'security': 'Security',
  'integration': 'Integration',
};

export const PLUGINS: Plugin[] = [
  {
    id: 'lemonade',
    name: 'Lemonade',
    description: 'Lightweight model optimization and compression toolkit for edge deployment.',
    longDescription: 'Squeeze the most performance out of your models with quantization, pruning, knowledge distillation, and edge-optimized export. Lemonade analyzes your model architecture and recommends the best compression strategy for your target hardware.',
    version: '1.2.0',
    author: 'Community Contributors',
    category: 'optimization',
    features: ['Quantization', 'Pruning', 'Knowledge Distillation', 'Edge Export'],
    icon: '🍋',
    workspaceDescription: 'Upload models, run optimization strategies, and download compressed artifacts.',
    nodes: [
      { type: 'quantize', label: 'Quantize', color: '#8b5cf6', description: 'Reduce model precision for faster inference' },
      { type: 'prune', label: 'Prune', color: '#a855f7', description: 'Remove redundant weights from the model' },
      { type: 'distill', label: 'Distill', color: '#c084fc', description: 'Transfer knowledge to a smaller student model' },
    ],
  },
  {
    id: 'gatorade',
    name: 'Gatorade',
    description: 'High-performance data hydration and pipeline accelerator.',
    longDescription: 'Keep your ML pipelines fueled with fast data streaming and intelligent caching. Gatorade provides multi-source connectors, smart prefetching, and auto-scaling data loaders that adapt to your training workload in real time.',
    version: '2.0.1',
    author: 'Community Contributors',
    category: 'data-pipeline',
    features: ['Data Streaming', 'Smart Caching', 'Auto-scaling', 'Multi-source Connectors'],
    icon: '⚡',
    workspaceDescription: 'Configure data sources, caching rules, and monitor streaming throughput.',
    nodes: [
      { type: 'stream', label: 'Stream Data', color: '#06b6d4', description: 'Ingest live data streams into pipelines' },
      { type: 'cache', label: 'Cache', color: '#0891b2', description: 'Smart cache layer for training data' },
      { type: 'transform', label: 'Transform', color: '#22d3ee', description: 'Apply transformations on the fly' },
    ],
  },
  {
    id: 'powerade',
    name: 'Powerade',
    description: 'GPU resource management and training power optimizer.',
    longDescription: 'Maximize GPU utilization and reduce training costs with intelligent scheduling. Powerade monitors power consumption, thermal throttling, and memory pressure to dynamically adjust workload distribution across your GPU fleet.',
    version: '1.5.3',
    author: 'Community Contributors',
    category: 'resource-management',
    features: ['GPU Scheduling', 'Cost Analytics', 'Power Monitoring', 'Auto-throttle'],
    icon: '🔋',
    workspaceDescription: 'Manage GPU fleet, scheduling policies, and power/cost dashboards.',
    nodes: [
      { type: 'gpu-allocate', label: 'GPU Allocate', color: '#f59e0b', description: 'Request GPU resources for workloads' },
      { type: 'throttle', label: 'Throttle', color: '#d97706', description: 'Auto-throttle based on thermal limits' },
      { type: 'monitor', label: 'Monitor', color: '#fbbf24', description: 'Track GPU utilization and power draw' },
    ],
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    description: 'Real-time model drift detection and performance monitoring.',
    longDescription: 'Continuously monitor your deployed models for data drift, concept drift, and performance degradation. Sentinel provides automated alerts, retraining triggers, and detailed drift analysis dashboards.',
    version: '1.0.4',
    author: 'Community Contributors',
    category: 'monitoring',
    features: ['Drift Detection', 'Alerting', 'Performance Dashboards', 'Retrain Triggers'],
    icon: '🛡️',
    workspaceDescription: 'Configure drift rules, view alerts, and set retrain thresholds.',
    nodes: [
      { type: 'drift-check', label: 'Drift Check', color: '#10b981', description: 'Detect data and concept drift' },
      { type: 'alert-rule', label: 'Alert Rule', color: '#059669', description: 'Define alerting conditions' },
      { type: 'dashboard', label: 'Dashboard', color: '#34d399', description: 'Embed monitoring dashboard' },
    ],
  },
  {
    id: 'vault-ml',
    name: 'Vault ML',
    description: 'Model and data security with access control and audit trails.',
    longDescription: 'Secure your ML assets with fine-grained access control, encryption at rest and in transit, model signing, and comprehensive audit logging. Vault ML integrates with your existing identity provider for SSO.',
    version: '0.9.2',
    author: 'Community Contributors',
    category: 'security',
    features: ['Access Control', 'Encryption', 'Model Signing', 'Audit Logging'],
    icon: '🔐',
    workspaceDescription: 'Manage access policies, audit logs, and model signing.',
    nodes: [
      { type: 'encrypt', label: 'Encrypt', color: '#ef4444', description: 'Encrypt model artifacts at rest' },
      { type: 'sign', label: 'Sign Model', color: '#dc2626', description: 'Cryptographically sign model versions' },
      { type: 'audit', label: 'Audit', color: '#f87171', description: 'Log access and changes to ML assets' },
    ],
  },
  {
    id: 'bridge',
    name: 'Bridge',
    description: 'Connect external ML platforms and model registries seamlessly.',
    longDescription: 'Bridge provides bidirectional sync with external platforms like MLflow, Weights & Biases, HuggingFace Hub, and SageMaker. Import models, export experiments, and keep your ML ecosystem connected.',
    version: '1.1.0',
    author: 'Community Contributors',
    category: 'integration',
    features: ['MLflow Sync', 'W&B Integration', 'HuggingFace Import', 'SageMaker Bridge'],
    icon: '🌉',
    workspaceDescription: 'Connect external platforms and trigger import/export sync.',
    nodes: [
      { type: 'import', label: 'Import Model', color: '#6366f1', description: 'Import models from external registries' },
      { type: 'export', label: 'Export Experiment', color: '#4f46e5', description: 'Push experiments to external tools' },
      { type: 'sync', label: 'Sync', color: '#818cf8', description: 'Bidirectional platform sync' },
    ],
  },
];

export const getPluginById = (id: string): Plugin | undefined =>
  PLUGINS.find((p) => p.id === id);

export const getPluginsByCategory = (category: string): Plugin[] =>
  PLUGINS.filter((p) => p.category === category);

export const DEPLOYED_PLUGINS_KEY = 'deployedPlugins';
export const LEGACY_INSTALLED_PLUGINS_KEY = 'installedPlugins';
export const PLUGIN_DEPLOYED_EVENT = 'plugin-deployed';
export const PLUGIN_CANVAS_PROJECT_NAME_KEY = 'pluginCanvasProjectName';
export const DEFAULT_PLUGIN_CANVAS_PROJECT = 'Plugin Workflows';

export const migrateDeployedPluginsStorage = (): void => {
  try {
    const legacy = localStorage.getItem(LEGACY_INSTALLED_PLUGINS_KEY);
    const current = localStorage.getItem(DEPLOYED_PLUGINS_KEY);
    if (legacy && !current) {
      localStorage.setItem(DEPLOYED_PLUGINS_KEY, legacy);
      localStorage.removeItem(LEGACY_INSTALLED_PLUGINS_KEY);
    }
  } catch {
    // ignore migration errors
  }
};

migrateDeployedPluginsStorage();

export const getDeployedPluginIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(DEPLOYED_PLUGINS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const setDeployedPluginIds = (ids: string[]): void => {
  localStorage.setItem(DEPLOYED_PLUGINS_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(PLUGIN_DEPLOYED_EVENT));
};

export const getDeployedPlugins = (): Plugin[] => {
  const ids = new Set(getDeployedPluginIds());
  return PLUGINS.filter((p) => ids.has(p.id));
};

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

export const getPluginWorkspacePath = (pluginId: string): string =>
  `/plugins/${pluginId}/workspace`;

export const toCanvasProjectSlug = (displayName: string): string =>
  displayName.toLowerCase().replace(/\s+/g, '-');
