import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PageSection,
  Title,
  Flex,
  FlexItem,
  Content,
  Label,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Alert,
  Divider,
  Tabs,
  Tab,
  TabTitleText,
  FormGroup,
  TextInput,
  Switch,
  Progress,
  ProgressMeasureLocation,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  MenuToggleElement,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExternalLinkAltIcon,
  PlayIcon,
  TrashIcon,
  SyncAltIcon,
  CogIcon,
  TachometerAltIcon,
} from '@patternfly/react-icons';
import { getEarlyAccessFeatureById, FeatureFlipCardData } from '../../data/previewFeatures';
import { WORKFLOW_TEMPLATES } from '../../data/workflowTemplates';
import {
  deployFeature,
  getFeatureDeployment,
  removeFeatureDeployment,
  updateFeatureDeploymentStatus,
} from '../../data/featureExperienceStore';
import { DeployPhaseChecklist, DEPLOY_PHASE_ORDER } from '../components/DeployPhaseChecklist';
import { FeatureMockupPreview } from '../CommunityPlugins/FeatureMockupPreview';
import '../CommunityPlugins/PluginWorkspace.css';
import { EarlyAccessBreadcrumb } from './EarlyAccessBreadcrumb';
import { SupportLevelBanner } from '../components/SupportLevelBanner';

function toProjectSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'early-access-sandbox';
}

function createCanvasProjectFromTemplate(
  featureName: string,
  templateId: string,
): { displayName: string; slug: string } {
  const template = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
  const displayName = `${featureName} Sandbox`;
  const slug = toProjectSlug(displayName);
  const existingProjects = JSON.parse(localStorage.getItem('canvasProjects') || '[]') as string[];
  if (!existingProjects.includes(displayName)) {
    existingProjects.push(displayName);
    localStorage.setItem('canvasProjects', JSON.stringify(existingProjects));
  }
  if (template) {
    const now = new Date().toISOString();
    const nodes = template.nodes.map((n, idx) => ({ ...n, id: `${n.id}-${Date.now()}-${idx}` }));
    const idMap = new Map<string, string>();
    template.nodes.forEach((orig, idx) => idMap.set(orig.id, nodes[idx].id));
    const connections = template.connections.map((c, idx) => ({
      ...c,
      id: `conn-${Date.now()}-${idx}`,
      source: idMap.get(c.source) || c.source,
      target: idMap.get(c.target) || c.target,
    }));
    localStorage.setItem(`workflow-${slug}`, JSON.stringify({ projectName: slug, nodes, connections, timestamp: now, templateId: template.id, earlyAccessFeature: true }));
  }
  window.dispatchEvent(new Event('projectsUpdated'));
  return { displayName, slug };
}

/* ───── shared helpers ───── */

interface WorkspaceTableProps { headers: string[]; rows: React.ReactNode[][] }
const WorkspaceTable: React.FC<WorkspaceTableProps> = ({ headers, rows }) => (
  <table className="workspace-table">
    <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
    <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
  </table>
);

const MetricCard: React.FC<{ value: string | number; label: string }> = ({ value, label }) => (
  <Card isCompact isFullHeight>
    <CardBody style={{ padding: '12px 16px', textAlign: 'center' }}>
      <div className="workspace-metric" style={{ padding: '4px 0' }}>
        <span className="workspace-metric-value" style={{ fontSize: '1.4rem' }}>{value}</span>
        <span className="workspace-metric-label">{label}</span>
      </div>
    </CardBody>
  </Card>
);

/* ═══════════════════════════════════════════════════════════════════
   App-shell wrapper: renders each sandbox inside a fake product UI
   with a sidebar nav, main content, and status bar.
   ═══════════════════════════════════════════════════════════════════ */

const shellStyle: React.CSSProperties = { display: 'flex', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', minHeight: 520, background: '#fff' };
const sidebarStyle: React.CSSProperties = { width: 180, background: '#f9fafb', borderRight: '1px solid #e5e7eb', padding: '12px 0', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 };
const navBtnBase: React.CSSProperties = { display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: '#374151' };
const navBtnActive: React.CSSProperties = { ...navBtnBase, background: '#e0e7ff', fontWeight: 600, color: '#4338ca', borderLeft: '3px solid #6366f1' };
const mainStyle: React.CSSProperties = { flex: 1, padding: 16, overflowY: 'auto', maxHeight: 600 };
const statusBarStyle: React.CSSProperties = { background: '#f3f4f6', borderTop: '1px solid #e5e7eb', padding: '6px 16px', fontSize: '0.75rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between' };

interface AppShellProps { navItems: string[]; activeNav: string; onNav: (item: string) => void; accent: string; statusText: string; children: React.ReactNode }
const AppShell: React.FC<AppShellProps> = ({ navItems, activeNav, onNav, accent, statusText, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div style={shellStyle}>
      <div style={sidebarStyle}>
        <div style={{ padding: '4px 16px 12px', fontWeight: 700, fontSize: '0.9rem', color: accent, borderBottom: '1px solid #e5e7eb', marginBottom: 4 }}>Sandbox</div>
        {navItems.map((item) => (
          <button key={item} type="button" style={activeNav === item ? { ...navBtnActive, borderLeftColor: accent, color: accent } : navBtnBase} onClick={() => onNav(item)}>{item}</button>
        ))}
      </div>
      <div style={mainStyle}>{children}</div>
    </div>
    <div style={statusBarStyle}><span>{statusText}</span><span><Label color="green" isCompact>Connected</Label></span></div>
  </div>
);

/* ── GenAI ── */
const GenAISandbox: React.FC = () => {
  const [nav, setNav] = React.useState('Workbench');
  const [prompt, setPrompt] = React.useState('');
  const [model, setModel] = React.useState('llama-3.1-8b');
  const [guardrails, setGuardrails] = React.useState(true);
  const [running, setRunning] = React.useState(false);
  const [response, setResponse] = React.useState('');
  return (
    <AppShell navItems={['Workbench', 'Templates', 'RAG Sources', 'Runs', 'Guardrails']} activeNav={nav} onNav={setNav} accent="#8b5cf6" statusText="GenAI Sandbox | llama-3.1-8b">
      {nav === 'Workbench' && <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        <FormGroup label="Prompt" fieldId="g-p"><TextInput id="g-p" placeholder="Summarize the following document..." value={prompt} onChange={(_e, v) => setPrompt(v)} /></FormGroup>
        <FormGroup label="Model" fieldId="g-m"><TextInput id="g-m" value={model} onChange={(_e, v) => setModel(v)} /></FormGroup>
        <FormGroup label="Guardrails" fieldId="g-g"><Switch id="g-g" label="Content filtering" isChecked={guardrails} onChange={(_e, c) => setGuardrails(c)} /></FormGroup>
        <Button variant="primary" icon={<PlayIcon />} isDisabled={running || !prompt.trim()} onClick={() => { setRunning(true); setResponse(''); setTimeout(() => { setResponse('Key findings: (1) Revenue grew 12% YoY, (2) Retention improved to 94%, (3) Three new market segments.'); setRunning(false); }, 1800); }}>Run Inference</Button>
        {running && <Progress value={65} title="Generating..." measureLocation={ProgressMeasureLocation.outside} />}
        {response && <Card style={{ background: '#f0fdf4', borderLeft: '3px solid #22c55e' }}><CardBody><p style={{ margin: 0, fontSize: '0.875rem' }}>{response}</p></CardBody></Card>}
      </Flex>}
      {nav === 'Templates' && <WorkspaceTable headers={['Template', 'Model', 'Variables', 'Last used']} rows={[['Summarize Doc', 'llama-3.1-8b', '2', '2 min ago'], ['Extract Entities', 'mistral-7b', '1', '15 min ago'], ['Q&A from KB', 'llama-3.1-8b', '3', '1 hr ago']]} />}
      {nav === 'RAG Sources' && <WorkspaceTable headers={['Source', 'Type', 'Documents', 'Status']} rows={[['Company Wiki', 'Vector DB', '12,400', <Label key="1" color="green">Indexed</Label>], ['Support Tickets', 'Elasticsearch', '84,000', <Label key="2" color="green">Synced</Label>], ['Product Docs', 'PDF Corpus', '340', <Label key="3" color="blue">Indexing</Label>]]} />}
      {nav === 'Runs' && <WorkspaceTable headers={['Prompt', 'Model', 'Tokens', 'Latency', 'Status']} rows={[['Summarize Q3 report', 'llama-3.1-8b', '342', '1.2s', <Label key="1" color="green">Complete</Label>], ['Extract entities', 'mistral-7b', '218', '0.9s', <Label key="2" color="green">Complete</Label>], ['RAG query', 'llama-3.1-8b', '891', '3.4s', <Label key="3" color="blue">Running</Label>]]} />}
      {nav === 'Guardrails' && <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}><WorkspaceTable headers={['Rule', 'Type', 'Action', 'Status']} rows={[['PII filter', 'Output', 'Redact', <Label key="1" color="green">Active</Label>], ['Toxicity check', 'Output', 'Block', <Label key="2" color="green">Active</Label>], ['Prompt injection', 'Input', 'Reject', <Label key="3" color="green">Active</Label>]]} /></Flex>}
    </AppShell>
  );
};

/* ── EvalHub ── */
const EvalHubSandbox: React.FC = () => {
  const [nav, setNav] = React.useState('Compare');
  const [running, setRunning] = React.useState(false);
  const [done, setDone] = React.useState(false);
  return (
    <AppShell navItems={['Compare', 'Datasets', 'Rubrics', 'Reports', 'History']} activeNav={nav} onNav={setNav} accent="#06b6d4" statusText="EvalHub Sandbox | golden-dataset-v3">
      {nav === 'Compare' && <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        <Flex gap={{ default: 'gapMd' }}><FlexItem flex={{ default: 'flex_1' }}><Card style={{ borderTop: '3px solid #06b6d4' }}><CardBody><div className="workspace-metric" style={{ padding: '8px 0' }}><span className="workspace-metric-value" style={{ fontSize: '1.2rem' }}>llama-3.1-8b</span><span className="workspace-metric-label">Model A</span></div></CardBody></Card></FlexItem><FlexItem style={{ alignSelf: 'center', fontWeight: 700, color: '#9ca3af' }}>vs</FlexItem><FlexItem flex={{ default: 'flex_1' }}><Card style={{ borderTop: '3px solid #f59e0b' }}><CardBody><div className="workspace-metric" style={{ padding: '8px 0' }}><span className="workspace-metric-value" style={{ fontSize: '1.2rem' }}>mistral-7b</span><span className="workspace-metric-label">Model B</span></div></CardBody></Card></FlexItem></Flex>
        <Button variant="primary" icon={<PlayIcon />} isDisabled={running} onClick={() => { setRunning(true); setDone(false); setTimeout(() => { setRunning(false); setDone(true); }, 2000); }}>Run Evaluation</Button>
        {running && <Progress value={50} title="Evaluating..." measureLocation={ProgressMeasureLocation.outside} />}
        {done && <WorkspaceTable headers={['Metric', 'Model A', 'Model B', 'Winner']} rows={[['Accuracy', '87%', '79%', <Label key="1" color="green">A</Label>], ['Latency p95', '1.8s', '1.2s', <Label key="2" color="green">B</Label>], ['Coherence', '4.2/5', '3.8/5', <Label key="3" color="green">A</Label>], ['Hallucination', '3%', '8%', <Label key="4" color="green">A</Label>]]} />}
      </Flex>}
      {nav === 'Datasets' && <WorkspaceTable headers={['Dataset', 'Samples', 'Split', 'Created']} rows={[['golden-v3', '1,200', '80/20', 'Jun 2026'], ['domain-qa', '480', '70/30', 'May 2026'], ['safety-eval', '320', '100/0', 'Apr 2026']]} />}
      {nav === 'Rubrics' && <WorkspaceTable headers={['Rubric', 'Criteria', 'Weight', 'Status']} rows={[['Accuracy', '3 criteria', '40%', <Label key="1" color="green">Active</Label>], ['Fluency', '2 criteria', '30%', <Label key="2" color="green">Active</Label>], ['Safety', '4 criteria', '30%', <Label key="3" color="green">Active</Label>]]} />}
      {nav === 'Reports' && <WorkspaceTable headers={['Report', 'Models', 'Dataset', 'Date']} rows={[['Eval #42', 'llama vs mistral', 'golden-v3', 'Jul 15'], ['Eval #41', 'llama vs gpt-4o', 'domain-qa', 'Jul 10']]} />}
      {nav === 'History' && <WorkspaceTable headers={['Run', 'Winner', 'Score', 'Duration']} rows={[['#42', 'Model A (87%)', '87 vs 79', '2m 14s'], ['#41', 'Model B (91%)', '85 vs 91', '3m 02s']]} />}
    </AppShell>
  );
};

/* ── KF Trainer ── */
const KFTrainerSandbox: React.FC = () => {
  const [nav, setNav] = React.useState('Jobs');
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => { if (!running) return undefined; if (progress >= 100) { setRunning(false); return undefined; } const t = setTimeout(() => setProgress((p) => Math.min(p + 12, 100)), 500); return () => clearTimeout(t); }, [running, progress]);
  return (
    <AppShell navItems={['Jobs', 'GPU Presets', 'Checkpoints', 'Metrics', 'Logs']} activeNav={nav} onNav={setNav} accent="#f59e0b" statusText="KF Trainer | 4 workers x 2 GPUs">
      {nav === 'Jobs' && <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        <Button variant="primary" icon={<PlayIcon />} isDisabled={running} onClick={() => { setRunning(true); setProgress(0); }}>Launch Training Job</Button>
        {running && <Progress value={progress} title={`Epoch ${Math.ceil(progress / 10)} / 10`} measureLocation={ProgressMeasureLocation.outside} />}
        {!running && progress >= 100 && <Alert variant="success" isInline title="Training complete">Best checkpoint at epoch 8, loss 0.0142.</Alert>}
        <WorkspaceTable headers={['Job', 'Workers', 'GPUs', 'Epochs', 'Status']} rows={[['train-042', '4', '2', '10', <Label key="1" color="green">Complete</Label>], ['train-041', '4', '2', '10', <Label key="2" color="green">Complete</Label>], ['train-040', '2', '1', '5', <Label key="3" color="grey">Stopped</Label>]]} />
      </Flex>}
      {nav === 'GPU Presets' && <WorkspaceTable headers={['Preset', 'Workers', 'GPUs/worker', 'Memory', 'Priority']} rows={[['Large', '8', '4', '640 GB', <Label key="1" color="blue">High</Label>], ['Medium', '4', '2', '160 GB', <Label key="2" color="green">Normal</Label>], ['Small', '2', '1', '40 GB', <Label key="3" color="grey">Low</Label>]]} />}
      {nav === 'Checkpoints' && <WorkspaceTable headers={['Checkpoint', 'Epoch', 'Loss', 'Size', 'Saved']} rows={[['ckpt-ep10', '10', '0.0142', '2.4 GB', '5 min ago'], ['ckpt-ep8', '8', '0.0189', '2.4 GB', '12 min ago'], ['ckpt-ep5', '5', '0.0341', '2.4 GB', '22 min ago']]} />}
      {nav === 'Metrics' && <><Flex gap={{ default: 'gapMd' }}><FlexItem flex={{ default: 'flex_1' }}><MetricCard value="0.0142" label="Final loss" /></FlexItem><FlexItem flex={{ default: 'flex_1' }}><MetricCard value="96.8%" label="Accuracy" /></FlexItem><FlexItem flex={{ default: 'flex_1' }}><MetricCard value="94%" label="GPU util" /></FlexItem></Flex><WorkspaceTable headers={['Epoch', 'Loss', 'Accuracy', 'GPU Util', 'Duration']} rows={[['10', '0.0142', '96.8%', '94%', '4m 12s'], ['8', '0.0189', '96.1%', '92%', '4m 08s'], ['5', '0.0341', '94.2%', '91%', '4m 15s']]} /></>}
      {nav === 'Logs' && <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 6, fontSize: '0.8rem', maxHeight: 400, overflow: 'auto', margin: 0 }}>{`[12:04:32] Epoch 10/10 complete - loss: 0.0142 acc: 96.8%\n[12:04:28] Saving checkpoint ckpt-ep10...\n[12:04:15] Epoch 9/10 - loss: 0.0155 acc: 96.4%\n[12:03:58] Epoch 8/10 - loss: 0.0189 acc: 96.1%\n[12:03:42] Saving checkpoint ckpt-ep8 (best)...\n[12:03:30] Epoch 7/10 - loss: 0.0221 acc: 95.5%`}</pre>}
    </AppShell>
  );
};

/* ── GPUaaS ── */
const GPUaaSSandbox: React.FC = () => {
  const [nav, setNav] = React.useState('Dashboard');
  return (
    <AppShell navItems={['Dashboard', 'Allocations', 'Fleet', 'Quotas', 'Cost']} activeNav={nav} onNav={setNav} accent="#10b981" statusText="GPUaaS | 12 active allocations">
      {nav === 'Dashboard' && <><Flex gap={{ default: 'gapMd' }}><FlexItem flex={{ default: 'flex_1' }}><MetricCard value="87%" label="Utilization" /></FlexItem><FlexItem flex={{ default: 'flex_1' }}><MetricCard value="$142/hr" label="Cost" /></FlexItem><FlexItem flex={{ default: 'flex_1' }}><MetricCard value="12" label="Allocations" /></FlexItem><FlexItem flex={{ default: 'flex_1' }}><MetricCard value="3" label="Idle GPUs" /></FlexItem></Flex></>}
      {nav === 'Allocations' && <WorkspaceTable headers={['Team', 'GPUs', 'Type', 'Duration', 'Status']} rows={[['ML Platform', '4', 'A100', '2h 14m', <Label key="1" color="green">Active</Label>], ['NLP Team', '2', 'A100', '45m', <Label key="2" color="green">Active</Label>], ['Vision', '1', 'H100', '—', <Label key="3" color="blue">Idle</Label>]]} />}
      {nav === 'Fleet' && <WorkspaceTable headers={['Node', 'GPU Type', 'Utilization', 'Team', 'Status']} rows={[['gpu-node-01', 'A100 80GB', <Progress key="p1" value={92} measureLocation={ProgressMeasureLocation.outside} style={{ minWidth: 80 }} />, 'ML Platform', <Label key="1" color="green">Active</Label>], ['gpu-node-02', 'A100 80GB', <Progress key="p2" value={67} measureLocation={ProgressMeasureLocation.outside} style={{ minWidth: 80 }} />, 'NLP', <Label key="2" color="green">Active</Label>], ['gpu-node-03', 'H100 80GB', <Progress key="p3" value={34} measureLocation={ProgressMeasureLocation.outside} style={{ minWidth: 80 }} />, 'Vision', <Label key="3" color="blue">Idle</Label>]]} />}
      {nav === 'Quotas' && <WorkspaceTable headers={['Team', 'Quota', 'Used', 'Remaining']} rows={[['ML Platform', '8 GPUs', '4', '4'], ['NLP Team', '4 GPUs', '2', '2'], ['Vision', '2 GPUs', '1', '1']]} />}
      {nav === 'Cost' && <WorkspaceTable headers={['Team', 'This month', 'Last month', 'Trend']} rows={[['ML Platform', '$4,280', '$3,910', <Label key="1" color="orange">+9%</Label>], ['NLP Team', '$1,640', '$1,820', <Label key="2" color="green">-10%</Label>], ['Vision', '$820', '$750', <Label key="3" color="orange">+9%</Label>]]} />}
    </AppShell>
  );
};

/* ── Feature Store ── */
const FeatureStoreSandbox: React.FC = () => {
  const [nav, setNav] = React.useState('Registry');
  const [search, setSearch] = React.useState('');
  return (
    <AppShell navItems={['Registry', 'Serving', 'Lineage', 'Sources', 'Access']} activeNav={nav} onNav={setNav} accent="#6366f1" statusText="Feature Store | 4 features online">
      {nav === 'Registry' && <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}><FormGroup label="Search features" fieldId="fs-s"><TextInput id="fs-s" placeholder="user_embedding, click_count..." value={search} onChange={(_e, v) => setSearch(v)} /></FormGroup><WorkspaceTable headers={['Feature', 'Type', 'Source', 'Freshness', 'Consumers']} rows={[['user_embedding', 'FLOAT[128]', 'user-events', '< 1 min', '3 models'], ['click_count_7d', 'INT64', 'clickstream', '5 min', '2 models'], ['session_duration', 'FLOAT', 'analytics', '15 min', '5 models'], ['purchase_history', 'LIST[STR]', 'transactions', '1 hr', '2 models']]} /></Flex>}
      {nav === 'Serving' && <WorkspaceTable headers={['Feature', 'Mode', 'Latency p99', 'QPS', 'Status']} rows={[['user_embedding', 'Online', '2.4ms', '12k', <Label key="1" color="green">Serving</Label>], ['click_count_7d', 'Online', '1.1ms', '8k', <Label key="2" color="green">Serving</Label>], ['session_duration', 'Batch', '—', '—', <Label key="3" color="grey">Offline</Label>]]} />}
      {nav === 'Lineage' && <FeatureMockupPreview type="architecture" color="#6366f1" size="lg" label="Feature lineage" />}
      {nav === 'Sources' && <WorkspaceTable headers={['Source', 'Type', 'Records', 'Last Sync', 'Status']} rows={[['user-events', 'Kafka', '2.1M', '< 1 min', <Label key="1" color="green">Live</Label>], ['clickstream', 'Kinesis', '840k', '5 min', <Label key="2" color="green">Live</Label>], ['transactions', 'PostgreSQL', '320k', '1 hr', <Label key="3" color="blue">Batch</Label>]]} />}
      {nav === 'Access' && <WorkspaceTable headers={['Consumer', 'Features', 'Mode', 'Last Access']} rows={[['Recommender v2', '3', 'Online', '< 1 min'], ['Fraud Detector', '2', 'Online', '2 min'], ['Training Pipeline', '4', 'Batch', '3 hr']]} />}
    </AppShell>
  );
};

/* ── Pipelines v4 ── */
const PipelinesV4Sandbox: React.FC = () => {
  const [nav, setNav] = React.useState('DAG');
  const [cacheEnabled, setCacheEnabled] = React.useState(true);
  return (
    <AppShell navItems={['DAG', 'Runs', 'Cache', 'Retry Policy', 'Schedules']} activeNav={nav} onNav={setNav} accent="#ec4899" statusText="Pipelines v4 | run-042 complete">
      {nav === 'DAG' && <FeatureMockupPreview type="workflow" color="#ec4899" size="lg" label="Pipeline DAG" />}
      {nav === 'Runs' && <WorkspaceTable headers={['Run', 'Steps', 'Cached', 'Duration', 'Status']} rows={[['run-042', '12/12', '8', '2m 14s', <Label key="1" color="green">Complete</Label>], ['run-041', '10/12', '6', '—', <Label key="2" color="red">Failed</Label>], ['run-040', '12/12', '10', '1m 48s', <Label key="3" color="green">Complete</Label>]]} />}
      {nav === 'Cache' && <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}><FormGroup label="Step caching" fieldId="pc"><Switch id="pc" label="Content-addressed caching" isChecked={cacheEnabled} onChange={(_e, c) => setCacheEnabled(c)} /></FormGroup><WorkspaceTable headers={['Step', 'Cache Key', 'Hit Rate', 'Saved']} rows={[['preprocess', 'sha256:a3f...', '94%', '3m 20s'], ['train', 'sha256:b7c...', '0%', '—'], ['evaluate', 'sha256:d1e...', '88%', '1m 45s']]} /></Flex>}
      {nav === 'Retry Policy' && <WorkspaceTable headers={['Step', 'Max Retries', 'Backoff', 'Failure class']} rows={[['preprocess', '3', 'Exponential', 'Transient'], ['train', '1', 'None', 'All'], ['evaluate', '2', 'Linear', 'Transient']]} />}
      {nav === 'Schedules' && <WorkspaceTable headers={['Schedule', 'Cron', 'Last Run', 'Next Run', 'Status']} rows={[['Nightly retrain', '0 2 * * *', 'Jul 16 02:00', 'Jul 17 02:00', <Label key="1" color="green">Active</Label>], ['Weekly eval', '0 8 * * 1', 'Jul 14 08:00', 'Jul 21 08:00', <Label key="2" color="green">Active</Label>]]} />}
    </AppShell>
  );
};

/* ── vLLM ── */
const VLLMSandbox: React.FC = () => {
  const [nav, setNav] = React.useState('Dashboard');
  const [replicas, setReplicas] = React.useState('3');
  const [autoscale, setAutoscale] = React.useState(true);
  return (
    <AppShell navItems={['Dashboard', 'Endpoints', 'Scaling', 'Request Log', 'Models']} activeNav={nav} onNav={setNav} accent="#3b82f6" statusText="vLLM | 3 replicas | auto-scaling on">
      {nav === 'Dashboard' && <><Flex gap={{ default: 'gapMd' }}><FlexItem flex={{ default: 'flex_1' }}><MetricCard value="1,240" label="tokens/s" /></FlexItem><FlexItem flex={{ default: 'flex_1' }}><MetricCard value="48ms" label="TTFT" /></FlexItem><FlexItem flex={{ default: 'flex_1' }}><MetricCard value="91%" label="GPU util" /></FlexItem><FlexItem flex={{ default: 'flex_1' }}><MetricCard value="3" label="Replicas" /></FlexItem></Flex><Card style={{ marginTop: 12 }}><CardBody><code style={{ display: 'block', background: '#f3f4f6', padding: 12, borderRadius: 6, fontSize: '0.85rem' }}>POST https://vllm.sandbox.local/v1/chat/completions</code></CardBody></Card></>}
      {nav === 'Endpoints' && <WorkspaceTable headers={['Endpoint', 'Model', 'Replicas', 'Health', 'Traffic']} rows={[['chat/completions', 'llama-3.1-8b', '3', <Label key="1" color="green">Healthy</Label>, '840 req/min'], ['embeddings', 'bge-base-en', '2', <Label key="2" color="green">Healthy</Label>, '1.2k req/min']]} />}
      {nav === 'Scaling' && <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}><FormGroup label="Replicas" fieldId="vr"><TextInput id="vr" type="number" value={replicas} onChange={(_e, v) => setReplicas(v)} /></FormGroup><FormGroup label="Auto-scaling" fieldId="va"><Switch id="va" label="Scale from traffic" isChecked={autoscale} onChange={(_e, c) => setAutoscale(c)} /></FormGroup><Button variant="primary" icon={<SyncAltIcon />}>Apply</Button></Flex>}
      {nav === 'Request Log' && <WorkspaceTable headers={['Time', 'Model', 'Tokens', 'Latency', 'Status']} rows={[['12:04:32', 'llama-3.1-8b', '256', '82ms', <Label key="1" color="green">200</Label>], ['12:04:28', 'llama-3.1-8b', '1,024', '320ms', <Label key="2" color="green">200</Label>], ['12:04:15', 'mistral-7b', '512', '148ms', <Label key="3" color="green">200</Label>]]} />}
      {nav === 'Models' && <WorkspaceTable headers={['Model', 'Size', 'Backend', 'Loaded', 'Status']} rows={[['llama-3.1-8b', '8B', 'vLLM', 'Yes', <Label key="1" color="green">Serving</Label>], ['mistral-7b', '7B', 'vLLM', 'Yes', <Label key="2" color="green">Serving</Label>], ['bge-base-en', '110M', 'vLLM', 'Yes', <Label key="3" color="green">Serving</Label>]]} />}
    </AppShell>
  );
};

/* ── Agent Catalog ── */
const AGENT_RECIPES = [
  { id: 'support', name: 'Support Agent', desc: 'Customer queries', tools: 3 },
  { id: 'research', name: 'Research Agent', desc: 'Paper summaries', tools: 5 },
  { id: 'ops', name: 'Ops Agent', desc: 'Infra runbooks', tools: 4 },
];

interface DeployedAgent {
  id: string;
  name: string;
  deployedAt: string;
  invocations: number;
  avgLatency: string;
  status: 'deploying' | 'running';
  progress: number;
}

const AgentCatalogSandbox: React.FC = () => {
  const [nav, setNav] = React.useState('Recipes');
  const [selected, setSelected] = React.useState<string | null>(null);
  const [deployed, setDeployed] = React.useState<DeployedAgent[]>([
    { id: 'support', name: 'Support Agent', deployedAt: 'Jul 15', invocations: 2140, avgLatency: '4.2s', status: 'running', progress: 100 },
    { id: 'research', name: 'Research Agent', deployedAt: 'Jul 12', invocations: 420, avgLatency: '8.1s', status: 'running', progress: 100 },
  ]);

  const handleDeploy = React.useCallback(() => {
    if (!selected) return;
    const recipe = AGENT_RECIPES.find((a) => a.id === selected);
    if (!recipe) return;
    if (deployed.some((d) => d.id === selected)) { setNav('Deployed'); return; }

    const now = new Date();
    const dateStr = `${now.toLocaleString('en-US', { month: 'short' })} ${now.getDate()}`;
    const newAgent: DeployedAgent = {
      id: recipe.id, name: recipe.name, deployedAt: dateStr,
      invocations: 0, avgLatency: '—', status: 'deploying', progress: 0,
    };
    setDeployed((prev) => [...prev, newAgent]);
    setNav('Deployed');
  }, [selected, deployed]);

  React.useEffect(() => {
    const deploying = deployed.find((d) => d.status === 'deploying');
    if (!deploying) return undefined;
    if (deploying.progress >= 100) {
      setDeployed((prev) => prev.map((d) => d.id === deploying.id ? { ...d, status: 'running' as const, avgLatency: '3.8s' } : d));
      return undefined;
    }
    const t = setTimeout(() => {
      setDeployed((prev) => prev.map((d) => d.id === deploying.id ? { ...d, progress: Math.min(d.progress + 20, 100) } : d));
    }, 400);
    return () => clearTimeout(t);
  }, [deployed]);

  const alreadyDeployed = selected ? deployed.some((d) => d.id === selected) : false;

  return (
    <AppShell navItems={['Recipes', 'Deployed', 'MCP Tools', 'Activity', 'Settings']} activeNav={nav} onNav={setNav} accent="#14b8a6" statusText={`Agent Catalog | ${deployed.filter((d) => d.status === 'running').length} agents running`}>
      {nav === 'Recipes' && <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        <Flex gap={{ default: 'gapMd' }} flexWrap={{ default: 'wrap' }}>{AGENT_RECIPES.map((a) => {
          const isDeployed = deployed.some((d) => d.id === a.id && d.status === 'running');
          return (
            <FlexItem key={a.id} style={{ flex: '1 1 160px' }}>
              <Card isSelectable isSelected={selected === a.id} onClick={() => setSelected(a.id)} style={{ cursor: 'pointer', borderTop: selected === a.id ? '3px solid #14b8a6' : '3px solid transparent' }}>
                <CardBody>
                  <strong>{a.name}</strong>
                  <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '4px 0' }}>{a.desc}</p>
                  <Flex gap={{ default: 'gapSm' }}>
                    <FlexItem><Label isCompact>{a.tools} tools</Label></FlexItem>
                    {isDeployed && <FlexItem><Label isCompact color="green">Deployed</Label></FlexItem>}
                  </Flex>
                </CardBody>
              </Card>
            </FlexItem>
          );
        })}</Flex>
        {selected && (
          <Button variant="primary" icon={alreadyDeployed ? <CheckCircleIcon /> : <PlayIcon />} onClick={handleDeploy}>
            {alreadyDeployed ? 'View Deployed Agent' : 'Deploy Agent'}
          </Button>
        )}
      </Flex>}
      {nav === 'Deployed' && (
        deployed.length === 0
          ? <Alert variant="info" isInline title="No agents deployed">Select a recipe and click Deploy Agent to get started.</Alert>
          : <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
              {deployed.map((d) => (
                d.status === 'deploying' ? (
                  <FlexItem key={d.id}>
                    <Card><CardBody>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                        <FlexItem flex={{ default: 'flex_1' }}><strong>{d.name}</strong></FlexItem>
                        <FlexItem><Label color="blue" isCompact>Deploying</Label></FlexItem>
                      </Flex>
                      <Progress value={d.progress} title="Provisioning agent..." measureLocation={ProgressMeasureLocation.outside} style={{ marginTop: 8 }} />
                    </CardBody></Card>
                  </FlexItem>
                ) : null
              ))}
              <WorkspaceTable
                headers={['Agent', 'Status', 'Invocations', 'Avg Latency', 'Deployed']}
                rows={deployed.filter((d) => d.status === 'running').map((d) => [
                  d.name,
                  <Label key={`s-${d.id}`} color="green">Running</Label>,
                  d.invocations.toLocaleString(),
                  d.avgLatency,
                  d.deployedAt,
                ])}
              />
            </Flex>
      )}
      {nav === 'MCP Tools' && <WorkspaceTable headers={['Tool', 'Server', 'Type', 'Status']} rows={[['search_docs', 'knowledge-base', 'Read', <Label key="1" color="green">Connected</Label>], ['create_ticket', 'jira', 'Write', <Label key="2" color="green">Connected</Label>], ['query_db', 'postgres', 'Read', <Label key="3" color="green">Connected</Label>], ['send_email', 'smtp', 'Write', <Label key="4" color="grey">Disabled</Label>]]} />}
      {nav === 'Activity' && <WorkspaceTable headers={['Agent', 'Action', 'Tools Used', 'Duration', 'Status']} rows={[['Support', 'Answer ticket #4821', '2', '4.2s', <Label key="1" color="green">Done</Label>], ['Research', 'Summarize arXiv paper', '3', '8.1s', <Label key="2" color="green">Done</Label>], ['Ops', 'Check cluster health', '4', '—', <Label key="3" color="blue">Running</Label>]]} />}
      {nav === 'Settings' && <WorkspaceTable headers={['Setting', 'Value', 'Scope']} rows={[['Max concurrent agents', '5', 'Global'], ['Tool timeout', '30s', 'Per-tool'], ['Retry on failure', 'Enabled', 'Per-agent']]} />}
    </AppShell>
  );
};

/* ── Model Deployment ── */
const ModelDeploymentSandbox: React.FC = () => {
  const [nav, setNav] = React.useState('Traffic');
  const [canaryPct, setCanaryPct] = React.useState('10');
  const [blueGreen, setBlueGreen] = React.useState(false);
  return (
    <AppShell navItems={['Traffic', 'Versions', 'Health', 'Rollout', 'History']} activeNav={nav} onNav={setNav} accent="#ef4444" statusText="Model Deployment | v2.1 canary at 10%">
      {nav === 'Traffic' && <><Flex gap={{ default: 'gapMd' }}><FlexItem flex={{ default: 'flex_1' }}><MetricCard value="38ms" label="p50 latency" /></FlexItem><FlexItem flex={{ default: 'flex_1' }}><MetricCard value="0.12%" label="error rate" /></FlexItem><FlexItem flex={{ default: 'flex_1' }}><MetricCard value="99.9%" label="availability" /></FlexItem></Flex><WorkspaceTable headers={['Version', 'Traffic', 'Latency', 'Errors', 'Status']} rows={[['v2.1 (canary)', `${canaryPct}%`, '36ms', '0.08%', <Label key="1" color="blue">Canary</Label>], ['v2.0 (stable)', `${100 - Number(canaryPct)}%`, '38ms', '0.12%', <Label key="2" color="green">Stable</Label>]]} /></>}
      {nav === 'Versions' && <WorkspaceTable headers={['Version', 'Created', 'Model', 'Image', 'Status']} rows={[['v2.1', 'Jul 15', 'llama-3.1-8b', 'quay.io/serve:2.1', <Label key="1" color="blue">Canary</Label>], ['v2.0', 'Jul 1', 'llama-3.1-8b', 'quay.io/serve:2.0', <Label key="2" color="green">Stable</Label>], ['v1.9', 'Jun 15', 'llama-3-8b', 'quay.io/serve:1.9', <Label key="3" color="grey">Retired</Label>]]} />}
      {nav === 'Health' && <WorkspaceTable headers={['Check', 'v2.1 (canary)', 'v2.0 (stable)', 'Threshold']} rows={[['Latency p50', '36ms', '38ms', '< 100ms'], ['Error rate', '0.08%', '0.12%', '< 1%'], ['Memory', '4.2 GB', '4.1 GB', '< 8 GB'], ['GPU util', '78%', '82%', '< 95%']]} />}
      {nav === 'Rollout' && <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        <FormGroup label={`Canary traffic: ${canaryPct}%`} fieldId="md-c"><input type="range" id="md-c" min="0" max="100" value={canaryPct} onChange={(e) => setCanaryPct(e.target.value)} style={{ width: '100%' }} /></FormGroup>
        <FormGroup label="Blue/green" fieldId="md-b"><Switch id="md-b" label="Blue/green cutover" isChecked={blueGreen} onChange={(_e, c) => setBlueGreen(c)} /></FormGroup>
        <Flex gap={{ default: 'gapSm' }}><Button variant="primary" icon={<CheckCircleIcon />}>Promote</Button><Button variant="danger">Rollback</Button></Flex>
      </Flex>}
      {nav === 'History' && <WorkspaceTable headers={['Action', 'Version', 'By', 'Date', 'Result']} rows={[['Promote', 'v2.0', 'admin', 'Jul 1', <Label key="1" color="green">Success</Label>], ['Rollback', 'v1.8', 'admin', 'Jun 20', <Label key="2" color="orange">Rolled back</Label>], ['Promote', 'v1.9', 'admin', 'Jun 15', <Label key="3" color="green">Success</Label>]]} />}
    </AppShell>
  );
};

/* ── workspace map ── */
const SANDBOX_WORKSPACES: Record<string, React.FC> = {
  genai: GenAISandbox,
  evalhub: EvalHubSandbox,
  'kf-trainer': KFTrainerSandbox,
  gpuaas: GPUaaSSandbox,
  'feature-store': FeatureStoreSandbox,
  'pipelines-v4': PipelinesV4Sandbox,
  vllm: VLLMSandbox,
  'agent-catalog': AgentCatalogSandbox,
  'model-deployment': ModelDeploymentSandbox,
};

/* ═══════════════════════════════════════════════════════════════════
   Main FeatureSandbox page
   ═══════════════════════════════════════════════════════════════════ */

const FeatureSandbox: React.FunctionComponent = () => {
  const { featureId = '' } = useParams<{ featureId: string }>();
  const navigate = useNavigate();
  const feature = getEarlyAccessFeatureById(featureId);

  const [deployPhaseIndex, setDeployPhaseIndex] = React.useState(0);
  const [isDeploying, setIsDeploying] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'deploying' | 'running' | 'stopped'>('idle');
  const [activeTab, setActiveTab] = React.useState<string | number>(0);

  const templateId = feature?.quickstartTemplateId || 'lightweight-ds-workbench';
  const template = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
  const autoStartedRef = React.useRef(false);

  const startDeploy = React.useCallback(() => {
    if (!feature) return;
    deployFeature(feature.id, templateId);
    setStatus('deploying');
    setIsDeploying(true);
    setDeployPhaseIndex(0);
  }, [feature, templateId]);

  React.useEffect(() => {
    if (!feature || autoStartedRef.current) return;
    autoStartedRef.current = true;
    const existing = getFeatureDeployment(feature.id);
    if (existing && existing.status === 'running') { setStatus('running'); return; }
    startDeploy();
  }, [feature, startDeploy]);

  React.useEffect(() => {
    if (!isDeploying || !feature) return undefined;
    if (deployPhaseIndex < DEPLOY_PHASE_ORDER.length - 1) {
      const t = setTimeout(() => setDeployPhaseIndex((p) => p + 1), 450);
      return () => clearTimeout(t);
    }
    const { displayName } = createCanvasProjectFromTemplate(feature.name, templateId);
    updateFeatureDeploymentStatus(feature.id, 'running', displayName);
    setIsDeploying(false);
    setStatus('running');
    return undefined;
  }, [isDeploying, deployPhaseIndex, feature, templateId]);

  const handleTeardown = () => { if (!feature) return; removeFeatureDeployment(feature.id); setStatus('stopped'); };
  const handleRedeploy = () => { autoStartedRef.current = false; startDeploy(); };

  if (!feature) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Alert variant="danger" title="Feature not found" isInline>
          This Early Access feature does not exist.{' '}
          <Button variant="link" isInline onClick={() => navigate('/early-access')}>Back to Overview</Button>
        </Alert>
      </PageSection>
    );
  }

  const SandboxWorkspace = SANDBOX_WORKSPACES[feature.id];

  return (
    <PageSection hasBodyWrapper={false} style={{ paddingTop: '16px', paddingBottom: '16px' }}>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>

        {/* ── Header ── */}
        <FlexItem>
          <EarlyAccessBreadcrumb items={[{ label: 'Deployed', to: '/early-access/deployed' }, { label: feature.name }]} />
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
            <FlexItem>
              <Title headingLevel="h1" size="xl">
                <span style={{ marginRight: '8px' }}>{feature.icon}</span>{feature.name}
              </Title>
            </FlexItem>
            <FlexItem><Label color={feature.badgeColor}>{feature.badgeLabel}</Label></FlexItem>
            <FlexItem>
              <Label color={status === 'running' ? 'green' : status === 'deploying' ? 'blue' : 'grey'}>
                {status === 'idle' ? 'ready' : status}
              </Label>
            </FlexItem>
          </Flex>
          <Content>
            <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '0.85rem' }}>
              {feature.description}
            </p>
          </Content>
        </FlexItem>

        <FlexItem>
          <SupportLevelBanner context="early-access" />
        </FlexItem>

        {/* ── Summary metric tiles ── */}
        <FlexItem>
          <Flex gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
            <FlexItem style={{ flex: '1 1 100px' }}><MetricCard value={status === 'running' ? 'Running' : status} label="Status" /></FlexItem>
            <FlexItem style={{ flex: '1 1 100px' }}><MetricCard value={`~${feature.metrics.perfLatencyMs}ms`} label="Latency" /></FlexItem>
            <FlexItem style={{ flex: '1 1 100px' }}><MetricCard value={feature.metrics.perfThroughput} label="Throughput" /></FlexItem>
            <FlexItem style={{ flex: '1 1 100px' }}><MetricCard value={feature.metrics.adoptionCount} label="Deployments" /></FlexItem>
            <FlexItem style={{ flex: '1 1 100px' }}><MetricCard value={`${feature.metrics.compatScore}%`} label="Compatibility" /></FlexItem>
          </Flex>
        </FlexItem>

        {/* ── Deploying state ── */}
        {isDeploying && (
          <FlexItem>
            <Card><CardBody>
              <DeployPhaseChecklist
                title={`Deploying ${feature.name}`}
                subtitle={template ? `Auto-connected quickstart: ${template.name}` : 'Preparing sandbox virtual instance'}
                activePhaseIndex={deployPhaseIndex}
                isComplete={false}
              />
            </CardBody></Card>
          </FlexItem>
        )}

        {/* ── Running: tabbed workspace ── */}
        {!isDeploying && status === 'running' && (
          <FlexItem>
            <Tabs activeKey={activeTab} onSelect={(_e, key) => setActiveTab(key)} aria-label="Feature sandbox tabs">

              {/* Overview tab — the interactive workspace */}
              <Tab eventKey={0} title={<TabTitleText>Overview</TabTitleText>}>
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} style={{ marginTop: 16 }}>
                  {SandboxWorkspace ? <SandboxWorkspace /> : (
                    <>
                      <FlexItem>
                        <Card style={{ borderTop: `3px solid ${feature.color}` }}>
                          <CardHeader><CardTitle>Interactive Preview</CardTitle></CardHeader>
                          <CardBody><FeatureMockupPreview type={feature.mockupType} color={feature.color} size="lg" label={`${feature.name} sandbox`} /></CardBody>
                        </Card>
                      </FlexItem>
                      <FlexItem>
                        <Card><CardHeader><CardTitle>Capabilities</CardTitle></CardHeader><CardBody>
                          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#4b5563', fontSize: '0.875rem' }}>
                            {feature.keyCapabilities.map((c) => <li key={c.title} style={{ marginBottom: 6 }}><strong>{c.title}</strong> — {c.description}</li>)}
                          </ul>
                        </CardBody></Card>
                      </FlexItem>
                    </>
                  )}
                </Flex>
              </Tab>

              {/* Configuration tab */}
              <Tab eventKey={1} title={<TabTitleText><CogIcon style={{ marginRight: 4 }} />Configuration</TabTitleText>}>
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} style={{ marginTop: 16 }}>
                  <FlexItem>
                    <Card><CardHeader><CardTitle>Deployment Configuration</CardTitle></CardHeader><CardBody>
                      <DescriptionList>
                        <DescriptionListGroup><DescriptionListTerm>Quickstart template</DescriptionListTerm><DescriptionListDescription>{template?.name || 'Default'}</DescriptionListDescription></DescriptionListGroup>
                        <DescriptionListGroup><DescriptionListTerm>Category</DescriptionListTerm><DescriptionListDescription>{feature.category}</DescriptionListDescription></DescriptionListGroup>
                        <DescriptionListGroup><DescriptionListTerm>Maturity</DescriptionListTerm><DescriptionListDescription>{feature.badgeLabel} ({feature.maturityStage})</DescriptionListDescription></DescriptionListGroup>
                        <DescriptionListGroup><DescriptionListTerm>Expected GA</DescriptionListTerm><DescriptionListDescription>{feature.expectedTimeline}</DescriptionListDescription></DescriptionListGroup>
                      </DescriptionList>
                    </CardBody></Card>
                  </FlexItem>
                  <FlexItem>
                    <Card><CardHeader><CardTitle>Capabilities</CardTitle></CardHeader><CardBody>
                      <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#4b5563', fontSize: '0.875rem' }}>
                        {feature.keyCapabilities.map((c) => <li key={c.title} style={{ marginBottom: 6 }}><strong>{c.title}</strong> — {c.description}</li>)}
                      </ul>
                    </CardBody></Card>
                  </FlexItem>
                </Flex>
              </Tab>

              {/* Metrics tab */}
              <Tab eventKey={2} title={<TabTitleText><TachometerAltIcon style={{ marginRight: 4 }} />Metrics</TabTitleText>}>
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} style={{ marginTop: 16 }}>
                  <FlexItem>
                    <Flex gap={{ default: 'gapMd' }} flexWrap={{ default: 'wrap' }}>
                      <FlexItem flex={{ default: 'flex_1' }}><MetricCard value={`~${feature.metrics.perfLatencyMs}ms`} label="Avg latency" /></FlexItem>
                      <FlexItem flex={{ default: 'flex_1' }}><MetricCard value={feature.metrics.perfThroughput} label="Throughput" /></FlexItem>
                      <FlexItem flex={{ default: 'flex_1' }}><MetricCard value={feature.metrics.adoptionCount} label="Active deployments" /></FlexItem>
                      <FlexItem flex={{ default: 'flex_1' }}><MetricCard value={`${feature.metrics.compatScore}%`} label="Compatibility" /></FlexItem>
                    </Flex>
                  </FlexItem>
                  <FlexItem>
                    <Card><CardHeader><CardTitle>Platform Support</CardTitle></CardHeader><CardBody>
                      <Flex gap={{ default: 'gapSm' }}>
                        {feature.metrics.compatPlatforms.map((p) => <FlexItem key={p}><Label isCompact>{p}</Label></FlexItem>)}
                      </Flex>
                    </CardBody></Card>
                  </FlexItem>
                  <FlexItem>
                    <Card><CardHeader><CardTitle>Changelog</CardTitle></CardHeader><CardBody>
                      <WorkspaceTable headers={['Date', 'Update']} rows={feature.changelogEntries.map((e) => [e.date, e.text])} />
                    </CardBody></Card>
                  </FlexItem>
                </Flex>
              </Tab>

              {/* Settings tab */}
              <Tab eventKey={3} title={<TabTitleText>Settings</TabTitleText>}>
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} style={{ marginTop: 16 }}>
                  <FlexItem>
                    <Card><CardHeader><CardTitle>Sandbox Actions</CardTitle></CardHeader><CardBody>
                      <Flex gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
                        <Button variant="secondary" icon={<SyncAltIcon />} onClick={handleRedeploy}>Redeploy</Button>
                        <Button variant="danger" icon={<TrashIcon />} onClick={handleTeardown}>Teardown sandbox</Button>
                        <Button variant="link" onClick={() => navigate('/early-access/deployed')}>Back to Deployed</Button>
                      </Flex>
                    </CardBody></Card>
                  </FlexItem>
                  {feature.tryItPath && (
                    <FlexItem>
                      <Card><CardHeader><CardTitle>Related Product Page</CardTitle></CardHeader><CardBody>
                        <Button variant="link" isInline icon={<ExternalLinkAltIcon />} iconPosition="end" onClick={() => navigate(feature.tryItPath!)}>{feature.tryItPath}</Button>
                      </CardBody></Card>
                    </FlexItem>
                  )}
                </Flex>
              </Tab>
            </Tabs>
          </FlexItem>
        )}

        {/* ── Stopped state ── */}
        {!isDeploying && status === 'stopped' && (
          <FlexItem>
            <Alert variant="info" title="Sandbox torn down" isInline>
              This feature sandbox has been removed. Redeploy to continue exploring.
            </Alert>
            <div style={{ marginTop: 12 }}>
              <Button variant="primary" icon={<CheckCircleIcon />} onClick={handleRedeploy}>Experience It again</Button>
            </div>
          </FlexItem>
        )}
      </Flex>
    </PageSection>
  );
};

export { FeatureSandbox };
