# AI/ML Platform — Visual Helm Deployment & Plugin Ecosystem

A visual, self-service platform for deploying and managing AI/ML workloads on Kubernetes. Built on PatternFly, it replaces manual YAML authoring with a guided wizard, a visual Canvas for resource topology, and an extensible plugin marketplace.

## Key Features

### BYOH (Bring Your Own Helm) Wizard

A 4-step guided deployment flow: **Source → Configure → Review → Deploy**. Pick from a curated chart catalog (Whisper STT, Triton, Ray, JupyterHub) or bring your own via OCI registry, Git URL, or file upload. Each Kubernetes resource is individually configurable through structured forms — no YAML required.

### Canvas — Visual Workflow & Topology

Every deployed Helm release renders as a connected node graph on Canvas. Each K8s resource (ServingRuntime, InferenceService, PVC, RBAC, Job) is a draggable node showing its configuration. Connections show resource dependencies. Supports:

- Drag-and-drop node creation from a collapsible panel
- Multi-tab workflows per project
- Undo/redo, copy/paste, keyboard shortcuts
- Export to JSON and Helm chart
- Simulated execution with per-node deployment logs
- Grid toggle, minimap, fit-to-view

### Community Plugin Marketplace

6 community plugins, each with one-click deploy/undeploy, a dedicated workspace, and custom Canvas nodes:

| Plugin | Category | Description |
|--------|----------|-------------|
| Lemonade | Optimization | Model quantization, pruning, and knowledge distillation |
| Gatorade | Data Pipeline | High-performance data streaming and smart caching |
| Powerade | Resource Mgmt | GPU scheduling, cost analytics, and power monitoring |
| Sentinel | Monitoring | Real-time model drift detection and alerting |
| Vault ML | Security | Model signing, encryption, and audit logging |
| Bridge | Integration | Bidirectional sync with MLflow, W&B, HuggingFace |

Plugins open as workflow tabs under a shared, configurable Canvas project.

### Dashboard

Getting-started checklist, guided tour, and what's-new banner for onboarding. Quickstart wizard for loading workflow templates.

## Architecture

```
src/
├── app/
│   ├── Canvas/                  # Visual workflow editor
│   │   ├── WorkflowCanvas.tsx   # Main canvas component (nodes, connections, toolbar)
│   │   ├── DynamicProject.tsx   # Route → canvas project resolver
│   │   ├── components/          # NodePanel, ExecutionOverlay, QuickstartWizard
│   │   ├── utils/               # Helm chart exporter, workflow helpers
│   │   └── types.ts             # NodeData, Connection, WorkflowNode types
│   ├── CommunityPlugins/        # Plugin marketplace
│   │   ├── PluginBrowse.tsx     # Browse & search all plugins
│   │   ├── PluginDetail.tsx     # Plugin info, deploy/undeploy wizard
│   │   ├── PluginWorkspace.tsx  # Per-plugin workspace with Canvas integration
│   │   └── BYOHWizard.tsx       # Bring Your Own Helm deployment wizard
│   ├── Dashboard/               # Home dashboard with onboarding
│   ├── AppLayout/               # Sidebar navigation, page chrome
│   └── contexts/                # SidebarContext
├── data/
│   ├── pluginRegistry.ts        # Plugin definitions, deploy state, migration
│   ├── byohChartCatalog.ts      # BYOH chart catalog and deployment records
│   └── workflowTemplates.ts     # Canvas workflow templates
└── services/
    ├── workflowService.ts       # Workflow CRUD and localStorage persistence
    └── claudeService.ts         # AI service integration
```

## Quick Start

```bash
git clone <repo-url>
cd patternfly-react-seed
npm install
npm run start:dev
```

Open `http://localhost:9000` in your browser.

## Development Scripts

```bash
# Start development server (hot reload)
npm run start:dev

# Production build (outputs to dist/)
npm run build

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Format
npm run format

# Analyze bundle size
npm run bundle-profile:analyze

# Start production server (build first)
npm run start
```

## Tech Stack

- **UI Framework:** [PatternFly 6](https://www.patternfly.org/) (React)
- **Language:** TypeScript
- **Bundler:** Webpack 5
- **Routing:** React Router v6
- **State:** React hooks + localStorage persistence
- **Testing:** Jest + React Testing Library
- **Linting:** ESLint + Prettier

## Data Flow

Workflow and plugin state is persisted to `localStorage`:

| Key | Purpose |
|-----|---------|
| `canvasProjects` | List of project display names |
| `workflow-{projectName}` | Nodes, connections, workflow tabs per project |
| `deployedPlugins` | Array of deployed plugin IDs |
| `byoh-deployments` | BYOH deployment history |
| `pluginCanvasProjectName` | Shared Canvas project name for plugin workflows |

Custom events (`plugin-deployed`, `projectsUpdated`, `storage`) keep the sidebar navigation and Canvas in sync.

## Configuration

- [TypeScript Config](./tsconfig.json)
- [Webpack Config](./webpack.common.js)
- [Jest Config](./jest.config.js)
- [Editor Config](./.editorconfig)

## Environment Variables

Uses [dotenv-webpack](https://www.npmjs.com/package/dotenv-webpack). Export at the system level or drop a `.env` file in the root:

```bash
ENV_1=http://1.myendpoint.com
ENV_2=http://2.myendpoint.com
```

Access in code via `process.env.ENV_1`.
