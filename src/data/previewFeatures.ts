export type MaturityStage =
  | 'concept'
  | 'design'
  | 'prototype'
  | 'dev-preview'
  | 'tech-preview'
  | 'ga';

export type MockupType = 'architecture' | 'workflow' | 'ui-mockup';

export type BadgeColor = 'blue' | 'teal' | 'green' | 'orange' | 'purple' | 'red' | 'orangered' | 'grey' | 'yellow';

export interface FeatureCapability {
  title: string;
  description: string;
}

export interface ChangelogEntry {
  date: string;
  text: string;
}

export interface FeatureMetrics {
  adoptionCount: number;
  perfLatencyMs: number;
  perfThroughput: string;
  compatPlatforms: string[];
  compatScore: number;
}

export interface FeatureFlipCardData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  highlights: string[];
  badgeLabel: string;
  badgeColor: BadgeColor;
  maturityStage: MaturityStage;
  category: string;
  useCases: string[];
  keyCapabilities: FeatureCapability[];
  expectedTimeline: string;
  lastUpdated: string;
  changelogEntries: ChangelogEntry[];
  relatedFeatureIds: string[];
  /** @deprecated Prefer Experience It sandbox via feature id */
  tryItPath?: string;
  quickstartTemplateId?: string;
  mockupType: MockupType;
  baseInterestCount: number;
  metrics: FeatureMetrics;
}

export const MATURITY_STAGES: { id: MaturityStage; label: string }[] = [
  { id: 'concept', label: 'Concept' },
  { id: 'design', label: 'Design' },
  { id: 'prototype', label: 'Prototype' },
  { id: 'dev-preview', label: 'DP' },
  { id: 'tech-preview', label: 'TP' },
  { id: 'ga', label: 'GA' },
];

export function getMaturityIndex(stage: MaturityStage): number {
  return MATURITY_STAGES.findIndex((s) => s.id === stage);
}

export function formatRelativeDate(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const diffDays = Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
}

/** Unified Early Access catalog — DP/TP distinguished by badge only */
export const EARLY_ACCESS_FEATURES: FeatureFlipCardData[] = [
  {
    id: 'genai',
    name: 'GenAI',
    description: 'Generative AI workflows with LLM orchestration, prompt management, and RAG pipelines.',
    icon: '\uD83E\uDD16',
    color: '#8b5cf6',
    highlights: [
      'Compose multi-step LLM workflows visually',
      'Built-in prompt templates and RAG connectors',
      'Guardrails and evaluation hooks included',
    ],
    badgeLabel: 'DP',
    badgeColor: 'orange',
    maturityStage: 'dev-preview',
    category: 'AI/ML',
    useCases: [
      'Build RAG chatbots over enterprise documents',
      'Orchestrate multi-step LLM chains with guardrails',
      'Prototype prompt templates for team reuse',
      'Evaluate generation quality before production',
    ],
    keyCapabilities: [
      {
        title: 'Visual LLM orchestration',
        description: 'Drag-and-drop nodes for prompts, tools, retrievers, and guardrails on the canvas.',
      },
      {
        title: 'Prompt template library',
        description: 'Versioned prompt templates with variable slots and team sharing.',
      },
      {
        title: 'RAG connectors',
        description: 'Connect vector stores and document sources with built-in chunking presets.',
      },
      {
        title: 'Guardrail hooks',
        description: 'Attach content filters and evaluation steps before responses leave the pipeline.',
      },
    ],
    expectedTimeline: 'Q4 2026',
    lastUpdated: '2026-06-20',
    changelogEntries: [
      { date: '2026-06-20', text: 'Added RAG connector presets for common vector stores.' },
      { date: '2026-05-12', text: 'Prototype canvas nodes for prompt and guardrail steps.' },
      { date: '2026-04-01', text: 'Initial GenAI workflow concept approved.' },
    ],
    relatedFeatureIds: ['evalhub', 'vllm', 'agent-catalog'],
    tryItPath: '/plugins/quickstarts',
    quickstartTemplateId: 'ml-training-pipeline',
    mockupType: 'workflow',
    baseInterestCount: 48,
    metrics: {
      adoptionCount: 128,
      perfLatencyMs: 85,
      perfThroughput: '420 req/s',
      compatPlatforms: ['OpenShift', 'K8s'],
      compatScore: 92,
    },
  },
  {
    id: 'evalhub',
    name: 'EvalHub',
    description: 'Model evaluation hub for benchmarking, A/B testing, and quality scoring.',
    icon: '\uD83D\uDCCA',
    color: '#06b6d4',
    highlights: [
      'Side-by-side model comparisons',
      'Custom scoring rubrics and datasets',
      'Exportable evaluation reports',
    ],
    badgeLabel: 'TP',
    badgeColor: 'purple',
    maturityStage: 'tech-preview',
    category: 'AI/ML',
    useCases: [
      'Compare LLM candidates before promoting to production',
      'Define custom scoring rubrics for domain quality',
      'Run A/B evaluations against golden datasets',
      'Export reports for compliance and stakeholder review',
    ],
    keyCapabilities: [
      {
        title: 'Side-by-side comparisons',
        description: 'Compare outputs from multiple models on the same prompt set.',
      },
      {
        title: 'Custom rubrics',
        description: 'Author scoring rubrics with weighted criteria and automatic aggregation.',
      },
      {
        title: 'Dataset management',
        description: 'Upload and version evaluation datasets with split and sampling controls.',
      },
      {
        title: 'Exportable reports',
        description: 'Generate PDF/CSV evaluation reports for audits and team reviews.',
      },
    ],
    expectedTimeline: 'Q1 2027',
    lastUpdated: '2026-06-28',
    changelogEntries: [
      { date: '2026-06-28', text: 'Wireframe for comparison dashboard completed.' },
      { date: '2026-05-30', text: 'Rubric editor design approved.' },
      { date: '2026-04-15', text: 'EvalHub scoped as companion to GenAI workflows.' },
    ],
    relatedFeatureIds: ['genai', 'model-deployment', 'vllm'],
    quickstartTemplateId: 'hyperparameter-tuning',
    mockupType: 'ui-mockup',
    baseInterestCount: 36,
    metrics: {
      adoptionCount: 64,
      perfLatencyMs: 120,
      perfThroughput: '180 eval/s',
      compatPlatforms: ['OpenShift', 'K8s', 'EKS'],
      compatScore: 88,
    },
  },
  {
    id: 'kf-trainer',
    name: 'KF Trainer',
    description: 'Kubeflow Trainer integration for distributed training jobs on Kubernetes.',
    icon: '\uD83C\uDF93',
    color: '#f59e0b',
    highlights: [
      'One-click distributed training jobs',
      'GPU-aware scheduling presets',
      'Live training metrics on canvas',
    ],
    badgeLabel: 'DP',
    badgeColor: 'orange',
    maturityStage: 'dev-preview',
    category: 'Infrastructure',
    useCases: [
      'Launch distributed PyTorch jobs from the dashboard',
      'Apply GPU-aware presets for multi-node training',
      'Monitor live loss and throughput on the canvas',
      'Resume interrupted training with checkpoint restore',
    ],
    keyCapabilities: [
      {
        title: 'One-click distributed jobs',
        description: 'Submit Kubeflow TrainJobs with worker and master topology presets.',
      },
      {
        title: 'GPU-aware scheduling',
        description: 'Presets that respect accelerator profiles and cluster quotas.',
      },
      {
        title: 'Live metrics overlay',
        description: 'Stream training metrics onto canvas nodes during execution.',
      },
      {
        title: 'Checkpoint resume',
        description: 'Resume from last successful checkpoint after failure or pause.',
      },
    ],
    expectedTimeline: 'Q3 2026',
    lastUpdated: '2026-07-02',
    changelogEntries: [
      { date: '2026-07-02', text: 'Live metrics overlay prototype on canvas nodes.' },
      { date: '2026-05-18', text: 'GPU scheduling presets drafted.' },
      { date: '2026-03-22', text: 'KF Trainer integration spike completed.' },
    ],
    relatedFeatureIds: ['gpuaas', 'pipelines-v4', 'model-deployment'],
    tryItPath: '/training',
    quickstartTemplateId: 'ml-training-pipeline',
    mockupType: 'architecture',
    baseInterestCount: 41,
    metrics: {
      adoptionCount: 97,
      perfLatencyMs: 200,
      perfThroughput: '12 jobs/hr',
      compatPlatforms: ['OpenShift', 'K8s'],
      compatScore: 95,
    },
  },
  {
    id: 'gpuaas',
    name: 'GPUaaS',
    description: 'GPU-as-a-Service for on-demand accelerator provisioning and scheduling.',
    icon: '\u26A1',
    color: '#10b981',
    highlights: [
      'On-demand GPU slices and pools',
      'Quota-aware team scheduling',
      'Cost visibility per workload',
    ],
    badgeLabel: 'TP',
    badgeColor: 'purple',
    maturityStage: 'tech-preview',
    category: 'Infrastructure',
    useCases: [
      'Provision GPU slices for burst inference workloads',
      'Enforce team quotas across shared accelerator pools',
      'Track cost per workload for chargeback',
      'Schedule overnight training against idle GPU capacity',
    ],
    keyCapabilities: [
      {
        title: 'On-demand GPU pools',
        description: 'Request GPU slices and full devices from shared pools.',
      },
      {
        title: 'Quota-aware scheduling',
        description: 'Team and project quotas prevent over-subscription of accelerators.',
      },
      {
        title: 'Cost visibility',
        description: 'Per-workload cost estimates based on GPU-hours consumed.',
      },
      {
        title: 'Idle capacity reclaim',
        description: 'Automatically reclaim unused allocations back to the shared pool.',
      },
    ],
    expectedTimeline: 'Q4 2026',
    lastUpdated: '2026-06-10',
    changelogEntries: [
      { date: '2026-06-10', text: 'Cost visibility panel design complete.' },
      { date: '2026-04-28', text: 'Pool and slice provisioning API sketched.' },
      { date: '2026-03-05', text: 'GPUaaS concept validated with platform teams.' },
    ],
    relatedFeatureIds: ['kf-trainer', 'vllm', 'model-deployment'],
    quickstartTemplateId: 'monitoring-pipeline',
    mockupType: 'architecture',
    baseInterestCount: 52,
    metrics: {
      adoptionCount: 156,
      perfLatencyMs: 40,
      perfThroughput: '2.1k alloc/s',
      compatPlatforms: ['OpenShift', 'K8s', 'EKS'],
      compatScore: 90,
    },
  },
  {
    id: 'feature-store',
    name: 'Feature Store',
    description: 'Centralized feature repository for training and inference consistency.',
    icon: '\uD83D\uDDC3\uFE0F',
    color: '#6366f1',
    highlights: [
      'Online and offline feature serving',
      'Point-in-time correct joins',
      'Governance-ready lineage views',
    ],
    badgeLabel: 'DP',
    badgeColor: 'orange',
    maturityStage: 'dev-preview',
    category: 'Data Management',
    useCases: [
      'Serve online features for low-latency inference',
      'Build training datasets with point-in-time joins',
      'Audit feature lineage for compliance reviews',
      'Share curated features across data science teams',
    ],
    keyCapabilities: [
      {
        title: 'Online & offline serving',
        description: 'Dual-path feature serving for training and real-time inference.',
      },
      {
        title: 'Point-in-time joins',
        description: 'Correct historical feature values to prevent training leakage.',
      },
      {
        title: 'Lineage views',
        description: 'Trace features from source tables through transforms to consumers.',
      },
      {
        title: 'Team sharing',
        description: 'Publish and discover features with ownership and SLAs.',
      },
    ],
    expectedTimeline: 'Q1 2027',
    lastUpdated: '2026-05-22',
    changelogEntries: [
      { date: '2026-05-22', text: 'Lineage view wireframes reviewed.' },
      { date: '2026-04-08', text: 'Online/offline serving contract drafted.' },
      { date: '2026-02-14', text: 'Feature Store roadmap kickoff.' },
    ],
    relatedFeatureIds: ['pipelines-v4', 'model-deployment', 'genai'],
    tryItPath: '/feast',
    quickstartTemplateId: 'data-processing-pipeline',
    mockupType: 'architecture',
    baseInterestCount: 29,
    metrics: {
      adoptionCount: 71,
      perfLatencyMs: 12,
      perfThroughput: '8.5k feat/s',
      compatPlatforms: ['OpenShift', 'K8s'],
      compatScore: 86,
    },
  },
  {
    id: 'pipelines-v4',
    name: 'Pipelines v4',
    description: 'Next-generation pipeline engine with improved DAG execution and caching.',
    icon: '\uD83D\uDD04',
    color: '#ec4899',
    highlights: [
      'Faster DAG scheduling',
      'Smarter step caching',
      'Native retry and resume controls',
    ],
    badgeLabel: 'TP',
    badgeColor: 'purple',
    maturityStage: 'tech-preview',
    category: 'Data Management',
    useCases: [
      'Schedule complex ML DAGs with faster start times',
      'Cache expensive steps across pipeline reruns',
      'Retry failed steps without restarting the full DAG',
      'Resume paused pipelines from the last successful node',
    ],
    keyCapabilities: [
      {
        title: 'Faster DAG scheduling',
        description: 'Reduced cold-start latency for large multi-step pipelines.',
      },
      {
        title: 'Smarter step caching',
        description: 'Content-addressed cache invalidation for reproducible reruns.',
      },
      {
        title: 'Native retry controls',
        description: 'Per-step retry policies with backoff and failure classification.',
      },
      {
        title: 'Resume from checkpoint',
        description: 'Continue execution from the last successful node after pause or failure.',
      },
    ],
    expectedTimeline: 'Q3 2026',
    lastUpdated: '2026-07-08',
    changelogEntries: [
      { date: '2026-07-08', text: 'Step caching prototype passing internal benchmarks.' },
      { date: '2026-05-25', text: 'Retry/resume controls design finalized.' },
      { date: '2026-03-11', text: 'Pipelines v4 engine spike started.' },
    ],
    relatedFeatureIds: ['kf-trainer', 'feature-store', 'model-deployment'],
    tryItPath: '/pipelines',
    quickstartTemplateId: 'data-processing-pipeline',
    mockupType: 'workflow',
    baseInterestCount: 44,
    metrics: {
      adoptionCount: 112,
      perfLatencyMs: 55,
      perfThroughput: '340 DAG/hr',
      compatPlatforms: ['OpenShift', 'K8s', 'EKS'],
      compatScore: 94,
    },
  },
  {
    id: 'vllm',
    name: 'vLLM',
    description: 'High-throughput LLM serving with vLLM-optimized inference runtimes.',
    icon: '\uD83D\uDE80',
    color: '#3b82f6',
    highlights: [
      'PagedAttention-optimized serving',
      'Auto-scaling inference endpoints',
      'OpenAI-compatible API surface',
    ],
    badgeLabel: 'DP',
    badgeColor: 'orange',
    maturityStage: 'dev-preview',
    category: 'AI/ML',
    useCases: [
      'Serve LLMs with high throughput and low latency',
      'Auto-scale endpoints based on request concurrency',
      'Expose OpenAI-compatible APIs for existing clients',
      'Share GPU memory efficiently across concurrent requests',
    ],
    keyCapabilities: [
      {
        title: 'PagedAttention serving',
        description: 'Memory-efficient attention for higher concurrent request density.',
      },
      {
        title: 'Auto-scaling endpoints',
        description: 'Scale replicas from traffic and queue depth signals.',
      },
      {
        title: 'OpenAI-compatible API',
        description: 'Drop-in chat and completions endpoints for existing SDKs.',
      },
      {
        title: 'Runtime telemetry',
        description: 'Token throughput, TTFT, and GPU utilization out of the box.',
      },
    ],
    expectedTimeline: 'Q4 2026',
    lastUpdated: '2026-06-15',
    changelogEntries: [
      { date: '2026-06-15', text: 'OpenAI-compatible API surface validated.' },
      { date: '2026-05-01', text: 'Auto-scaling policy prototypes running in lab.' },
      { date: '2026-03-18', text: 'vLLM runtime integration design kickoff.' },
    ],
    relatedFeatureIds: ['genai', 'gpuaas', 'model-deployment'],
    tryItPath: '/modelServing',
    quickstartTemplateId: 'model-deployment-pipeline',
    mockupType: 'architecture',
    baseInterestCount: 57,
    metrics: {
      adoptionCount: 203,
      perfLatencyMs: 45,
      perfThroughput: '1.2k tok/s',
      compatPlatforms: ['OpenShift', 'K8s'],
      compatScore: 97,
    },
  },
  {
    id: 'agent-catalog',
    name: 'Agent Catalog',
    description: 'Discover and deploy pre-built AI agents for common enterprise tasks.',
    icon: '\uD83E\uDD16',
    color: '#14b8a6',
    highlights: [
      'Curated enterprise agent recipes',
      'One-click deploy to canvas',
      'Tooling and MCP connectors ready',
    ],
    badgeLabel: 'TP',
    badgeColor: 'purple',
    maturityStage: 'tech-preview',
    category: 'AI/ML',
    useCases: [
      'Browse curated agents for support, research, and ops',
      'Deploy an agent recipe to canvas in one click',
      'Connect agents to MCP tools and enterprise APIs',
      'Customize recipes with your own prompts and tools',
    ],
    keyCapabilities: [
      {
        title: 'Curated agent recipes',
        description: 'Enterprise-ready agent templates with documented inputs and tools.',
      },
      {
        title: 'One-click canvas deploy',
        description: 'Instantiate an agent workflow on the canvas with defaults filled in.',
      },
      {
        title: 'MCP connectors',
        description: 'Plug agents into Model Context Protocol tools and servers.',
      },
      {
        title: 'Recipe customization',
        description: 'Fork recipes, swap models, and tune tool permissions.',
      },
    ],
    expectedTimeline: 'Q1 2027',
    lastUpdated: '2026-06-05',
    changelogEntries: [
      { date: '2026-06-05', text: 'First agent recipe catalog mockups reviewed.' },
      { date: '2026-04-20', text: 'MCP connector contract drafted.' },
      { date: '2026-02-28', text: 'Agent Catalog concept approved.' },
    ],
    relatedFeatureIds: ['genai', 'vllm', 'model-deployment'],
    tryItPath: '/mcpServers',
    quickstartTemplateId: 'lightweight-ds-workbench',
    mockupType: 'ui-mockup',
    baseInterestCount: 39,
    metrics: {
      adoptionCount: 58,
      perfLatencyMs: 95,
      perfThroughput: '90 agent/hr',
      compatPlatforms: ['OpenShift', 'K8s', 'EKS'],
      compatScore: 84,
    },
  },
  {
    id: 'model-deployment',
    name: 'Model Deployment',
    description: 'Streamlined model deployment with canary rollouts and auto-scaling.',
    icon: '\uD83D\uDCE6',
    color: '#ef4444',
    highlights: [
      'Canary and blue/green rollouts',
      'Traffic splitting controls',
      'Autoscaling with SLO targets',
    ],
    badgeLabel: 'DP',
    badgeColor: 'orange',
    maturityStage: 'dev-preview',
    category: 'Infrastructure',
    useCases: [
      'Roll out model versions with canary traffic splits',
      'Run blue/green cutovers for zero-downtime upgrades',
      'Autoscale serving replicas against SLO targets',
      'Promote or roll back based on live error budgets',
    ],
    keyCapabilities: [
      {
        title: 'Canary & blue/green',
        description: 'Progressive delivery strategies for model serving revisions.',
      },
      {
        title: 'Traffic splitting',
        description: 'Fine-grained percentage controls across model versions.',
      },
      {
        title: 'SLO-based autoscaling',
        description: 'Scale replicas from latency and error-rate targets.',
      },
      {
        title: 'Promote / roll back',
        description: 'One-click promotion or rollback based on live health signals.',
      },
    ],
    expectedTimeline: 'Q3 2026',
    lastUpdated: '2026-07-01',
    changelogEntries: [
      { date: '2026-07-01', text: 'Traffic splitting controls prototype ready.' },
      { date: '2026-05-14', text: 'Canary rollout UX flows designed.' },
      { date: '2026-03-30', text: 'Model Deployment roadmap aligned with serving team.' },
    ],
    relatedFeatureIds: ['vllm', 'evalhub', 'gpuaas'],
    tryItPath: '/modelServing',
    quickstartTemplateId: 'model-deployment-pipeline',
    mockupType: 'workflow',
    baseInterestCount: 45,
    metrics: {
      adoptionCount: 141,
      perfLatencyMs: 38,
      perfThroughput: '2.4k req/s',
      compatPlatforms: ['OpenShift', 'K8s'],
      compatScore: 96,
    },
  },
];

/** @deprecated Use EARLY_ACCESS_FEATURES — kept for backward compatibility */
export function buildPreviewFeatures(
  badgeLabel: string,
  badgeColor: BadgeColor,
  maturityStage: MaturityStage
): FeatureFlipCardData[] {
  return EARLY_ACCESS_FEATURES.map((feature) => ({
    ...feature,
    badgeLabel,
    badgeColor,
    maturityStage,
  }));
}

export const DEVELOPER_PREVIEW_FEATURES = EARLY_ACCESS_FEATURES.filter(
  (f) => f.maturityStage === 'dev-preview'
);

export const TECHNICAL_PREVIEW_FEATURES = EARLY_ACCESS_FEATURES.filter(
  (f) => f.maturityStage === 'tech-preview'
);

export function getFeatureById(
  features: FeatureFlipCardData[],
  id: string
): FeatureFlipCardData | undefined {
  return features.find((f) => f.id === id);
}

export function getEarlyAccessFeatureById(id: string): FeatureFlipCardData | undefined {
  return EARLY_ACCESS_FEATURES.find((f) => f.id === id);
}
