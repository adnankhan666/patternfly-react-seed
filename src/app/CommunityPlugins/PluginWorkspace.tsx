import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  Content,
  Button,
  Label,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  FormGroup,
  TextInput,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  MenuToggleElement,
  Progress,
  ProgressMeasureLocation,
  Alert,
  Switch,
  Divider,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Modal,
  ModalVariant,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@patternfly/react-core';
import {
  PlayIcon,
  DownloadIcon,
  SyncIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ThIcon,
  RocketIcon,
} from '@patternfly/react-icons';
import {
  getPluginById,
  getDeployedPluginIds,
  getPluginCanvasProjectName,
  PLUGIN_CATEGORIES,
  Plugin,
} from '../../data/pluginRegistry';
import { appendPluginWorkflowToProject } from './pluginCanvasIntegration';
import { CommunityPluginsBreadcrumb } from './CommunityPluginsBreadcrumb';
import './PluginWorkspace.css';

interface WorkspaceTableProps {
  headers: string[];
  rows: React.ReactNode[][];
}

const WorkspaceTable: React.FunctionComponent<WorkspaceTableProps> = ({ headers, rows }) => (
  <table className="workspace-table">
    <thead>
      <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
      ))}
    </tbody>
  </table>
);

const categoryColors: Record<string, string> = {
  optimization: '#8b5cf6',
  'data-pipeline': '#06b6d4',
  'resource-management': '#f59e0b',
  monitoring: '#10b981',
  security: '#ef4444',
  integration: '#6366f1',
};

/* ── Lemonade Workspace ── */
const LemonadeWorkspace: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [modelFile, setModelFile] = React.useState('');
  const [strategy, setStrategy] = React.useState('quantize');
  const [strategyOpen, setStrategyOpen] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const strategyLabels: Record<string, string> = {
    quantize: 'Quantize (INT8)',
    prune: 'Prune (30% sparsity)',
    distill: 'Distill (teacher → student)',
  };

  const runOptimization = () => {
    if (!modelFile.trim()) return;
    setRunning(true);
    setDone(false);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setRunning(false);
          setDone(true);
          return 100;
        }
        return p + 10;
      });
    }, 400);
  };

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
      <FlexItem>
        <Card>
          <CardHeader><CardTitle>Optimize Model</CardTitle></CardHeader>
          <CardBody>
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
              <FormGroup label="Model file path" fieldId="lemonade-model">
                <TextInput
                  id="lemonade-model"
                  placeholder="/models/resnet50.onnx"
                  value={modelFile}
                  onChange={(_e, v) => setModelFile(v)}
                />
              </FormGroup>
              <FormGroup label="Optimization strategy" fieldId="lemonade-strategy">
                <Select
                  id="lemonade-strategy"
                  selected={strategy}
                  onSelect={(_e, val) => {
                    setStrategy(val as string);
                    setStrategyOpen(false);
                  }}
                  onOpenChange={(isOpen) => setStrategyOpen(isOpen)}
                  isOpen={strategyOpen}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setStrategyOpen(!strategyOpen)}
                      isExpanded={strategyOpen}
                    >
                      {strategyLabels[strategy]}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    <SelectOption value="quantize">Quantize (INT8)</SelectOption>
                    <SelectOption value="prune">Prune (30% sparsity)</SelectOption>
                    <SelectOption value="distill">Distill (teacher → student)</SelectOption>
                  </SelectList>
                </Select>
              </FormGroup>
              <Button
                variant="primary"
                icon={<PlayIcon />}
                onClick={runOptimization}
                isDisabled={running || !modelFile.trim()}
              >
                Run Optimization
              </Button>
              {running && (
                <Progress value={progress} title="Optimizing..." measureLocation={ProgressMeasureLocation.outside} />
              )}
              {done && (
                <Alert variant="success" title="Optimization complete" isInline>
                  Model size reduced by 62%.{' '}
                  <Button variant="link" icon={<DownloadIcon />} isInline>Download optimized model</Button>
                </Alert>
              )}
            </Flex>
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem>
        <Card>
          <CardHeader><CardTitle>Recent Runs</CardTitle></CardHeader>
          <CardBody>
            <WorkspaceTable
              headers={['Model', 'Strategy', 'Size Reduction', 'Status']}
              rows={[
                ['bert-base.onnx', 'Quantize', '58%', <Label key="s1" color="green">Complete</Label>],
                ['yolov8.pt', 'Prune', '41%', <Label key="s2" color="green">Complete</Label>],
                ['gpt2-small', 'Distill', '72%', <Label key="s3" color="blue">Running</Label>],
              ]}
            />
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem>
        <Card style={{ borderTop: '3px solid #ec4899' }}>
          <CardHeader><CardTitle>Helm Chart Deploy</CardTitle></CardHeader>
          <CardBody>
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
              <FlexItem>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  Deploy Helm charts to your cluster in minutes. Import charts directly into
                  the Canvas from our catalog, a URI, or a file upload.
                </p>
              </FlexItem>
              <FlexItem>
                <Button
                  variant="primary"
                  icon={<RocketIcon />}
                  onClick={() => navigate('/canvas')}
                >
                  Open Canvas
                </Button>
              </FlexItem>
            </Flex>
          </CardBody>
        </Card>
      </FlexItem>
    </Flex>
  );
};

/* ── Gatorade Workspace ── */
const GatoradeWorkspace: React.FunctionComponent = () => {
  const [source, setSource] = React.useState('s3://datasets/training');
  const [cacheEnabled, setCacheEnabled] = React.useState(true);
  const [throughput] = React.useState(1240);

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
      <FlexItem>
        <Card>
          <CardHeader><CardTitle>Data Sources</CardTitle></CardHeader>
          <CardBody>
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
              <FormGroup label="Primary data source" fieldId="gatorade-source">
                <TextInput id="gatorade-source" value={source} onChange={(_e, v) => setSource(v)} />
              </FormGroup>
              <FormGroup label="Smart caching" fieldId="gatorade-cache">
                <Switch
                  id="gatorade-cache"
                  label="Enable prefetch cache"
                  isChecked={cacheEnabled}
                  onChange={(_e, checked) => setCacheEnabled(checked)}
                />
              </FormGroup>
              <Button variant="primary" icon={<SyncIcon />}>Apply Configuration</Button>
            </Flex>
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem>
        <Flex gap={{ default: 'gapMd' }}>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Card isFullHeight>
              <CardBody>
                <div className="workspace-metric">
                  <span className="workspace-metric-value">{throughput.toLocaleString()}</span>
                  <span className="workspace-metric-label">records/sec throughput</span>
                </div>
              </CardBody>
            </Card>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Card isFullHeight>
              <CardBody>
                <div className="workspace-metric">
                  <span className="workspace-metric-value">94%</span>
                  <span className="workspace-metric-label">cache hit rate</span>
                </div>
              </CardBody>
            </Card>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Card isFullHeight>
              <CardBody>
                <div className="workspace-metric">
                  <span className="workspace-metric-value">3</span>
                  <span className="workspace-metric-label">active streams</span>
                </div>
              </CardBody>
            </Card>
          </FlexItem>
        </Flex>
      </FlexItem>
      <FlexItem>
        <Card>
          <CardHeader><CardTitle>Streaming Pipelines</CardTitle></CardHeader>
          <CardBody>
            <WorkspaceTable
              headers={['Pipeline', 'Source', 'Throughput', 'Status']}
              rows={[
                ['train-batch-01', 's3://datasets/training', '840 rec/s', <Label key="g1" color="green">Active</Label>],
                ['val-stream', 's3://datasets/validation', '320 rec/s', <Label key="g2" color="green">Active</Label>],
                ['feature-store', 'kafka://events', '80 rec/s', <Label key="g3" color="orange">Paused</Label>],
              ]}
            />
          </CardBody>
        </Card>
      </FlexItem>
    </Flex>
  );
};

/* ── Powerade Workspace ── */
const PoweradeWorkspace: React.FunctionComponent = () => {
  const gpus = [
    { id: 'gpu-0', model: 'NVIDIA A100', util: 87, power: 312, mem: 72 },
    { id: 'gpu-1', model: 'NVIDIA A100', util: 45, power: 198, mem: 41 },
    { id: 'gpu-2', model: 'NVIDIA V100', util: 12, power: 89, mem: 18 },
    { id: 'gpu-3', model: 'NVIDIA V100', util: 0, power: 42, mem: 0 },
  ];

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
      <FlexItem>
        <Flex gap={{ default: 'gapMd' }}>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Card isFullHeight><CardBody>
              <div className="workspace-metric"><span className="workspace-metric-value">$142.30</span><span className="workspace-metric-label">today&apos;s GPU cost</span></div>
            </CardBody></Card>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Card isFullHeight><CardBody>
              <div className="workspace-metric"><span className="workspace-metric-value">36%</span><span className="workspace-metric-label">fleet utilization</span></div>
            </CardBody></Card>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Card isFullHeight><CardBody>
              <div className="workspace-metric"><span className="workspace-metric-value">641W</span><span className="workspace-metric-label">total power draw</span></div>
            </CardBody></Card>
          </FlexItem>
        </Flex>
      </FlexItem>
      <FlexItem>
        <Card>
          <CardHeader>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
              <CardTitle>GPU Fleet</CardTitle>
              <Button variant="secondary" size="sm">Set Scheduling Policy</Button>
            </Flex>
          </CardHeader>
          <CardBody>
            <WorkspaceTable
              headers={['GPU', 'Model', 'Utilization', 'Power', 'Memory', 'Status']}
              rows={gpus.map((g) => [
                g.id,
                g.model,
                <Progress key={`u-${g.id}`} value={g.util} size="sm" aria-label={`${g.id} utilization`} />,
                `${g.power}W`,
                `${g.mem}%`,
                <Label key={`s-${g.id}`} color={g.util > 0 ? 'green' : 'grey'}>{g.util > 0 ? 'In Use' : 'Idle'}</Label>,
              ])}
            />
          </CardBody>
        </Card>
      </FlexItem>
    </Flex>
  );
};

/* ── Sentinel Workspace ── */
const SentinelWorkspace: React.FunctionComponent = () => {
  const [threshold, setThreshold] = React.useState('0.15');
  const [autoRetrain, setAutoRetrain] = React.useState(true);

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
      <FlexItem>
        <Card>
          <CardHeader><CardTitle>Drift Detection Rules</CardTitle></CardHeader>
          <CardBody>
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
              <FormGroup label="Drift threshold (PSI)" fieldId="sentinel-threshold">
                <TextInput id="sentinel-threshold" value={threshold} onChange={(_e, v) => setThreshold(v)} type="number" />
              </FormGroup>
              <FormGroup label="Auto-retrain on drift" fieldId="sentinel-retrain">
                <Switch
                  id="sentinel-retrain"
                  label="Trigger retrain pipeline when drift exceeds threshold"
                  isChecked={autoRetrain}
                  onChange={(_e, checked) => setAutoRetrain(checked)}
                />
              </FormGroup>
              <Button variant="primary">Save Rules</Button>
            </Flex>
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem>
        <Card>
          <CardHeader><CardTitle>Active Alerts</CardTitle></CardHeader>
          <CardBody>
            <WorkspaceTable
              headers={['Model', 'Drift Type', 'PSI Score', 'Severity', 'Time']}
              rows={[
                ['fraud-detector-v3', 'Data drift', '0.23', <Label key="a1" color="red" icon={<ExclamationTriangleIcon />}>Critical</Label>, '2 min ago'],
                ['churn-predictor', 'Concept drift', '0.17', <Label key="a2" color="orange">Warning</Label>, '1 hr ago'],
                ['recommendation-engine', 'Data drift', '0.08', <Label key="a3" color="green" icon={<CheckCircleIcon />}>Normal</Label>, '6 hr ago'],
              ]}
            />
          </CardBody>
        </Card>
      </FlexItem>
    </Flex>
  );
};

/* ── Vault ML Workspace ── */
const VaultMLWorkspace: React.FunctionComponent = () => {
  const [signModel, setSignModel] = React.useState('');
  const [signed, setSigned] = React.useState(false);

  const handleSign = () => {
    if (!signModel.trim()) return;
    setSigned(true);
    setTimeout(() => setSigned(false), 4000);
  };

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
      <FlexItem>
        <Card>
          <CardHeader><CardTitle>Sign Model</CardTitle></CardHeader>
          <CardBody>
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
              <FormGroup label="Model version" fieldId="vault-sign">
                <TextInput
                  id="vault-sign"
                  placeholder="fraud-detector-v3:1.2.0"
                  value={signModel}
                  onChange={(_e, v) => setSignModel(v)}
                />
              </FormGroup>
              <Button variant="primary" onClick={handleSign} isDisabled={!signModel.trim()}>Sign &amp; Publish</Button>
              {signed && <Alert variant="success" title="Model signed successfully" isInline />}
            </Flex>
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem>
        <Card>
          <CardHeader><CardTitle>Access Policies</CardTitle></CardHeader>
          <CardBody>
            <WorkspaceTable
              headers={['Policy', 'Scope', 'Users', 'Status']}
              rows={[
                ['model-read-prod', 'Production models', '12', <Label key="p1" color="green">Active</Label>],
                ['model-write-ml-team', 'All models', '5', <Label key="p2" color="green">Active</Label>],
                ['audit-viewer', 'Audit logs', '3', <Label key="p3" color="green">Active</Label>],
              ]}
            />
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem>
        <Card>
          <CardHeader><CardTitle>Audit Log</CardTitle></CardHeader>
          <CardBody>
            <WorkspaceTable
              headers={['Time', 'User', 'Action', 'Resource']}
              rows={[
                ['10:42 AM', 'alice@corp', 'Download', 'fraud-detector-v3'],
                ['10:38 AM', 'bob@corp', 'Sign', 'churn-predictor:2.1'],
                ['10:15 AM', 'system', 'Encrypt', 'recommendation-engine'],
              ]}
            />
          </CardBody>
        </Card>
      </FlexItem>
    </Flex>
  );
};

/* ── Bridge Workspace ── */
const BridgeWorkspace: React.FunctionComponent = () => {
  const [syncing, setSyncing] = React.useState<string | null>(null);

  const platforms = [
    { id: 'mlflow', name: 'MLflow', status: 'connected', lastSync: '5 min ago', models: 24 },
    { id: 'wandb', name: 'Weights & Biases', status: 'connected', lastSync: '12 min ago', models: 8 },
    { id: 'huggingface', name: 'HuggingFace Hub', status: 'connected', lastSync: '1 hr ago', models: 15 },
    { id: 'sagemaker', name: 'SageMaker', status: 'disconnected', lastSync: '—', models: 0 },
  ];

  const triggerSync = (id: string) => {
    setSyncing(id);
    setTimeout(() => setSyncing(null), 2500);
  };

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
      <FlexItem>
        <Card>
          <CardHeader><CardTitle>Connected Platforms</CardTitle></CardHeader>
          <CardBody>
            <WorkspaceTable
              headers={['Platform', 'Status', 'Models', 'Last Sync', 'Actions']}
              rows={platforms.map((p) => [
                p.name,
                <Label key={`st-${p.id}`} color={p.status === 'connected' ? 'green' : 'grey'}>
                  {p.status === 'connected' ? 'Connected' : 'Disconnected'}
                </Label>,
                String(p.models),
                p.lastSync,
                <Flex key={`act-${p.id}`} gap={{ default: 'gapXs' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<SyncIcon />}
                    onClick={() => triggerSync(p.id)}
                    isLoading={syncing === p.id}
                    isDisabled={p.status !== 'connected'}
                  >
                    Sync
                  </Button>
                  <Button variant="link" size="sm">Import</Button>
                </Flex>,
              ])}
            />
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem>
        <Card>
          <CardHeader><CardTitle>Recent Sync Activity</CardTitle></CardHeader>
          <CardBody>
            <WorkspaceTable
              headers={['Time', 'Direction', 'Platform', 'Artifact', 'Status']}
              rows={[
                ['10:40 AM', 'Import', 'HuggingFace', 'bert-base-uncased', <Label key="b1" color="green">Success</Label>],
                ['10:22 AM', 'Export', 'MLflow', 'experiment-run-4821', <Label key="b2" color="green">Success</Label>],
                ['09:55 AM', 'Import', 'W&B', 'training-metrics-v2', <Label key="b3" color="green">Success</Label>],
              ]}
            />
          </CardBody>
        </Card>
      </FlexItem>
    </Flex>
  );
};

const WORKSPACE_COMPONENTS: Record<string, React.FunctionComponent> = {
  lemonade: LemonadeWorkspace,
  gatorade: GatoradeWorkspace,
  powerade: PoweradeWorkspace,
  sentinel: SentinelWorkspace,
  'vault-ml': VaultMLWorkspace,
  bridge: BridgeWorkspace,
};

interface WorkspaceHeaderProps {
  plugin: Plugin;
  running: boolean;
  onToggleRunning: (running: boolean) => void;
  onViewOnCanvas: () => void;
}

const WorkspaceHeader: React.FunctionComponent<WorkspaceHeaderProps> = ({
  plugin,
  running,
  onToggleRunning,
  onViewOnCanvas,
}) => {
  const color = categoryColors[plugin.category] || '#6b7280';

  return (
    <Card style={{ borderTop: `3px solid ${color}` }}>
      <CardBody>
        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }} wrap="wrap">
          <FlexItem>
            <span style={{ fontSize: '2.5rem' }}>{plugin.icon}</span>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} wrap="wrap">
              <Title headingLevel="h1" size="2xl">{plugin.name} Workspace</Title>
              <Label isCompact style={{ background: `${color}18`, color }}>
                {PLUGIN_CATEGORIES[plugin.category]}
              </Label>
              <Label color={running ? 'green' : 'grey'} isCompact>
                {running ? 'Running' : 'Stopped'}
              </Label>
            </Flex>
            <p style={{ color: '#6b7280', margin: '4px 0 0' }}>{plugin.workspaceDescription}</p>
          </FlexItem>
          <FlexItem>
            <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
              <Button variant="secondary" icon={<ThIcon />} onClick={onViewOnCanvas}>
                View on Canvas
              </Button>
              <Switch
                id="workspace-running"
                label={running ? 'Stop' : 'Start'}
                isChecked={running}
                onChange={(_e, checked) => onToggleRunning(checked)}
              />
            </Flex>
          </FlexItem>
        </Flex>
        <Divider style={{ margin: '16px 0' }} />
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Version</DescriptionListTerm>
            <DescriptionListDescription>v{plugin.version}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Canvas Nodes</DescriptionListTerm>
            <DescriptionListDescription>
              {plugin.nodes.map((n) => n.label).join(', ')}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

const PluginWorkspace: React.FunctionComponent = () => {
  const { pluginId } = useParams<{ pluginId: string }>();
  const navigate = useNavigate();
  const plugin = pluginId ? getPluginById(pluginId) : undefined;
  const [running, setRunning] = React.useState(true);

  const isDeployed = pluginId ? getDeployedPluginIds().includes(pluginId) : false;
  const [canvasModalOpen, setCanvasModalOpen] = React.useState(false);
  const [canvasProjectName, setCanvasProjectName] = React.useState(() => getPluginCanvasProjectName());

  if (!plugin) {
    return (
      <PageSection hasBodyWrapper={false}>
        <EmptyState>
          <Title headingLevel="h1" size="lg">Plugin Not Found</Title>
          <EmptyStateBody>The plugin workspace you&apos;re looking for doesn&apos;t exist.</EmptyStateBody>
          <EmptyStateActions>
            <Button variant="primary" onClick={() => navigate('/plugins')}>Community Plugins</Button>
          </EmptyStateActions>
        </EmptyState>
      </PageSection>
    );
  }

  if (!isDeployed) {
    return (
      <PageSection hasBodyWrapper={false}>
        <EmptyState>
          <Title headingLevel="h1" size="lg">{plugin.name} Not Deployed</Title>
          <EmptyStateBody>
            Deploy {plugin.name} first to access its workspace and unlock canvas nodes.
          </EmptyStateBody>
          <EmptyStateActions>
            <Button variant="primary" onClick={() => navigate(`/plugins/${plugin.id}`)}>
              Deploy {plugin.name}
            </Button>
            <Button variant="link" onClick={() => navigate('/plugins')}>Community Plugins</Button>
          </EmptyStateActions>
        </EmptyState>
      </PageSection>
    );
  }

  const WorkspaceContent = WORKSPACE_COMPONENTS[plugin.id];

  const handleViewOnCanvas = () => {
    setCanvasProjectName(getPluginCanvasProjectName());
    setCanvasModalOpen(true);
  };

  const confirmViewOnCanvas = () => {
    const { slug } = appendPluginWorkflowToProject(plugin, canvasProjectName);
    setCanvasModalOpen(false);
    navigate(`/canvas/${slug}`);
  };

  return (
    <>
      <PageSection hasBodyWrapper={false} style={{ paddingTop: '16px', paddingBottom: '16px' }}>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} style={{ maxWidth: '1100px' }}>
        <FlexItem>
          <CommunityPluginsBreadcrumb
            items={[
              { label: 'Developer Preview', to: '/plugins/developer-preview?tab=plugins' },
              { label: plugin.name, to: `/plugins/${plugin.id}` },
              { label: 'Workspace' },
            ]}
          />
        </FlexItem>
        <FlexItem>
          <WorkspaceHeader
            plugin={plugin}
            running={running}
            onToggleRunning={setRunning}
            onViewOnCanvas={handleViewOnCanvas}
          />
        </FlexItem>
        <FlexItem>
          {WorkspaceContent ? <WorkspaceContent /> : (
            <Content><p>Workspace UI not available for this plugin.</p></Content>
          )}
        </FlexItem>
      </Flex>
    </PageSection>

      <Modal
        variant={ModalVariant.small}
        isOpen={canvasModalOpen}
        onClose={() => setCanvasModalOpen(false)}
        aria-label="Open plugin on canvas"
      >
        <ModalHeader title="Open on Canvas" />
        <ModalBody>
          <FormGroup label="Canvas project" fieldId="canvas-project-name">
            <TextInput
              id="canvas-project-name"
              value={canvasProjectName}
              onChange={(_e, val) => setCanvasProjectName(val)}
              placeholder="Plugin Workflows"
            />
          </FormGroup>
          <p style={{ color: '#6b7280', margin: '8px 0 0', fontSize: '0.875rem' }}>
            Opens {plugin.name} as a workflow tab under this shared project. Existing plugin tabs are reused.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" icon={<ThIcon />} onClick={confirmViewOnCanvas} isDisabled={!canvasProjectName.trim()}>
            Open Canvas
          </Button>
          <Button variant="link" onClick={() => setCanvasModalOpen(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export { PluginWorkspace };
