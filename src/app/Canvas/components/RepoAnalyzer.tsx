import * as React from 'react';
import {
  Button,
  TextInput,
  FormGroup,
  Form,
  Alert,
} from '@patternfly/react-core';
import { WorkflowTemplate } from '../../../data/workflowTemplates';

const API_BASE = process.env.API_URL || 'http://localhost:3001';

interface RepoAnalyzerProps {
  onTemplateReady: (template: WorkflowTemplate) => void;
}

type AnalyzerState = 'input' | 'loading' | 'preview';

const LOADING_MESSAGES = [
  'Fetching repository files...',
  'Reading dependencies and Dockerfile...',
  'Analyzing ML framework and model type...',
  'Generating deployment template with AI...',
  'Finalizing workflow nodes...',
];

const NODE_TYPE_COLORS: Record<string, string> = {
  'oci-secret': '#f59e0b',
  'serving-runtime': '#ef4444',
  'inference-service': '#8b5cf6',
  'pvc': '#06b6d4',
  'rbac': '#f97316',
  'notebook': '#ec4899',
  'job': '#22c55e',
};

export const RepoAnalyzer: React.FunctionComponent<RepoAnalyzerProps> = ({ onTemplateReady }) => {
  const [state, setState] = React.useState<AnalyzerState>('input');
  const [repoUrl, setRepoUrl] = React.useState('');
  const [githubToken, setGithubToken] = React.useState('');
  const [showToken, setShowToken] = React.useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [template, setTemplate] = React.useState<WorkflowTemplate | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const startMessageCycle = () => {
    let idx = 0;
    intervalRef.current = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setLoadingMsgIndex(idx);
    }, 2200);
  };

  const stopMessageCycle = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  React.useEffect(() => () => stopMessageCycle(), []);

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) return;
    setError(null);
    setLoadingMsgIndex(0);
    setState('loading');
    startMessageCycle();

    try {
      const response = await fetch(`${API_BASE}/api/repo-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          ...(githubToken.trim() ? { githubToken: githubToken.trim() } : {}),
        }),
      });

      const data = await response.json();
      stopMessageCycle();

      if (!response.ok) {
        setError(data.error || 'Failed to analyze repository');
        setState('input');
        return;
      }

      setTemplate(data.template);
      setState('preview');
    } catch {
      stopMessageCycle();
      setError('Could not connect to server. Make sure the backend is running.');
      setState('input');
    }
  };

  const handleLoad = () => {
    if (template) {
      onTemplateReady(template);
    }
  };

  const handleBack = () => {
    setState('input');
    setTemplate(null);
    setError(null);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div style={{ padding: '32px 16px' }}>
        <style>{`
          @keyframes repo-spin { to { transform: rotate(360deg); } }
          @keyframes repo-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes repo-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        `}</style>

        {/* Spinner + active step */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <div style={{
            flexShrink: 0,
            width: '40px', height: '40px',
            border: '3px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'repo-spin 0.8s linear infinite',
          }} />
          <div>
            <div key={loadingMsgIndex} style={{
              fontSize: '15px', fontWeight: 600, color: '#111827',
              animation: 'repo-fade-in 0.3s ease',
            }}>
              {LOADING_MESSAGES[loadingMsgIndex]}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              This usually takes 10–20 seconds
            </div>
          </div>
        </div>

        {/* Step list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {LOADING_MESSAGES.map((msg, i) => {
            const done = i < loadingMsgIndex;
            const active = i === loadingMsgIndex;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Status dot */}
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: done ? '#10b981' : active ? '#3b82f6' : '#d1d5db',
                  animation: active ? 'repo-pulse 1.2s ease-in-out infinite' : 'none',
                  transition: 'background 0.3s',
                }} />
                <span style={{
                  fontSize: '13px',
                  color: done ? '#10b981' : active ? '#111827' : '#9ca3af',
                  fontWeight: active ? 600 : 400,
                  transition: 'color 0.3s',
                }}>
                  {msg}{done ? ' ✓' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Preview state ──────────────────────────────────────────────────────────
  if (state === 'preview' && template) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Template header */}
        <div
          style={{
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '28px', lineHeight: 1 }}>{template.icon || '🐙'}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>{template.name}</div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>{template.description}</div>
          </div>
        </div>

        {/* Node list */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>
            Generated nodes ({template.nodes.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {template.nodes.map((node) => (
              <div
                key={node.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  background: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: NODE_TYPE_COLORS[node.type] || '#9ca3af',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 500, fontSize: '13px', flex: 1, color: '#111827' }}>
                  {node.label}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    fontFamily: 'monospace',
                  }}
                >
                  {node.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Connections count */}
        {template.connections.length > 0 && (
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {template.connections.length} connection{template.connections.length !== 1 ? 's' : ''} generated
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <Button variant="primary" onClick={handleLoad}>
            Load Template
          </Button>
          <Button variant="secondary" onClick={handleBack}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  // ── Input state ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
        Paste a public GitHub repository URL. The AI will analyze its files and generate a
        tailored Helm deployment workflow template for your canvas.
      </p>

      {error && (
        <Alert variant="danger" isInline title={error} />
      )}

      <Form>
        <FormGroup label="GitHub Repository URL" isRequired fieldId="repo-url">
          <TextInput
            isRequired
            type="url"
            id="repo-url"
            placeholder="https://github.com/owner/repo"
            value={repoUrl}
            onChange={(_e, val) => setRepoUrl(val)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
          />
        </FormGroup>

        {/* Collapsible private repo token section */}
        <div>
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#3b82f6',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '10px' }}>{showToken ? '▼' : '▶'}</span>
            {showToken ? 'Hide' : 'Add GitHub token'} (optional — for private repos)
          </button>

          {showToken && (
            <div style={{ marginTop: '12px' }}>
              <FormGroup
                label="Personal Access Token"
                fieldId="github-token"
              >
                <TextInput
                  type="password"
                  id="github-token"
                  placeholder="ghp_..."
                  value={githubToken}
                  onChange={(_e, val) => setGithubToken(val)}
                />
              </FormGroup>
            </div>
          )}
        </div>

        <Button
          variant="primary"
          onClick={handleAnalyze}
          isDisabled={!repoUrl.trim()}
        >
          Analyze Repository
        </Button>
      </Form>
    </div>
  );
};

RepoAnalyzer.displayName = 'RepoAnalyzer';
