import * as React from 'react';
import { DeploymentStatus, DeploymentLog, PHASE_DESCRIPTIONS } from '../types/deploymentPhases';
import './LoadingSpinner.css';

/**
 * Execution overlay component for workflow execution
 * Displays loading state with progress and statistics
 */

interface ExecutionOverlayProps {
  /** Current execution progress (0-100) */
  progress: number;
  /** Number of nodes currently executing */
  executingCount: number;
  /** Number of nodes completed */
  completedCount: number;
  /** Total number of nodes in workflow */
  totalNodes: number;
  /** Current execution status message */
  statusMessage?: string;
  /** Deployment status (for Helm workflows) */
  deploymentStatus?: DeploymentStatus | null;
  /** Callback to close the overlay */
  onClose?: () => void;
}

function formatLogAsText(log: DeploymentLog): string {
  const ts = log.timestamp.toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const node = log.nodeName ? ` [${log.nodeName}]` : '';
  const level = log.type === 'info' ? '' : ` [${log.type.toUpperCase()}]`;
  return `${ts}${node}${level} ${log.message}`;
}

function formatAllLogs(logs: DeploymentLog[]): string {
  return logs.map(formatLogAsText).join('\n');
}

export const ExecutionOverlay: React.FunctionComponent<ExecutionOverlayProps> = React.memo(({
  progress,
  executingCount,
  completedCount,
  totalNodes,
  statusMessage = 'Executing workflow...',
  deploymentStatus,
  onClose,
}) => {
  const pendingCount = totalNodes - completedCount - executingCount;
  const logsEndRef = React.useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Auto-scroll logs to bottom
  React.useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [deploymentStatus?.logs]);

  // Compute top offset so the overlay sits inside the canvas grid area
  const [canvasTop, setCanvasTop] = React.useState<number | null>(null);
  React.useEffect(() => {
    const canvas = document.querySelector('.workflow-canvas');
    if (canvas) {
      setCanvasTop(canvas.getBoundingClientRect().top + 12);
    }
  }, [deploymentStatus]);

  // Drag offset from the default CSS position
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStart = React.useRef({ mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0 });
  const overlayRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, offsetX: dragOffset.x, offsetY: dragOffset.y };
    setIsDragging(true);
    e.preventDefault();
  }, [dragOffset]);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setDragOffset({
      x: dragStart.current.offsetX + (e.clientX - dragStart.current.mouseX),
      y: dragStart.current.offsetY + (e.clientY - dragStart.current.mouseY),
    });
  }, [isDragging]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleCopyLogs = React.useCallback(() => {
    if (!deploymentStatus?.logs.length) return;
    const text = formatAllLogs(deploymentStatus.logs);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [deploymentStatus?.logs]);

  const handleDownloadLogs = React.useCallback(() => {
    if (!deploymentStatus?.logs.length) return;
    const text = formatAllLogs(deploymentStatus.logs);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }, [deploymentStatus?.logs]);

  // Render Helm deployment view
  if (deploymentStatus) {
    const phaseInfo = PHASE_DESCRIPTIONS[deploymentStatus.phase];
    const phasePercent = (deploymentStatus.phase / deploymentStatus.totalPhases) * 100;

    return (
      <div
        ref={overlayRef}
        className="execution-overlay helm-deployment"
        role="status"
        aria-labelledby="deployment-title"
        aria-live="polite"
        style={{
          top: canvasTop ?? undefined,
          transform: dragOffset.x || dragOffset.y ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : undefined,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="execution-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Title bar — draggable */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: isDragging ? 'grabbing' : 'grab',
              padding: '0 0 4px 0',
            }}
          >
            <div className="execution-title" id="deployment-title">
              {phaseInfo.icon} Helm Deployment
            </div>
            {onClose && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                style={{
                  background: 'transparent', border: 'none', color: '#9ca3af',
                  cursor: 'pointer', fontSize: '18px', padding: '2px 6px',
                  borderRadius: '4px', lineHeight: 1,
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#f3f4f6'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#9ca3af'; (e.target as HTMLElement).style.background = 'transparent'; }}
                title="Close"
              >
                ✕
              </button>
            )}
          </div>
          <div className="deployment-phase">
            Phase {deploymentStatus.phase}/{deploymentStatus.totalPhases}: {phaseInfo.name}
          </div>
          <div className="deployment-phase-desc">{phaseInfo.description}</div>

          {/* Phase Progress Bar */}
          <div className="phase-progress-container">
            <div className="phase-progress-bar" style={{ width: `${phasePercent}%` }} />
          </div>

          {/* Log toolbar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '6px', padding: '0 2px',
          }}>
            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
              {deploymentStatus.logs.length} log entries
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleCopyLogs}
                disabled={!deploymentStatus.logs.length}
                style={{
                  background: 'none', border: '1px solid #374151', borderRadius: '4px',
                  color: copied ? '#10b981' : '#9ca3af', cursor: 'pointer',
                  fontSize: '11px', padding: '2px 8px',
                  transition: 'color 0.2s',
                }}
                title="Copy all logs to clipboard"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownloadLogs}
                disabled={!deploymentStatus.logs.length}
                style={{
                  background: 'none', border: '1px solid #374151', borderRadius: '4px',
                  color: '#9ca3af', cursor: 'pointer',
                  fontSize: '11px', padding: '2px 8px',
                }}
                title="Download logs as .log file"
              >
                Download
              </button>
            </div>
          </div>

          {/* Deployment Logs — text is selectable */}
          <div
            className="deployment-logs"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              flex: '1 1 auto',
              overflowY: 'auto',
              overflowX: 'hidden',
              minHeight: 0,
              maxHeight: '100%',
              userSelect: 'text',
              WebkitUserSelect: 'text',
              cursor: 'text',
            }}
          >
            {deploymentStatus.logs.map((log) => (
              <div
                key={log.id}
                className={`deployment-log-entry log-${log.type}`}
                role="status"
              >
                <span className="log-time">
                  {log.timestamp.toLocaleTimeString('en-US', {
                    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
                  })}
                </span>
                {log.nodeName && <span className="log-node">[{log.nodeName}]</span>}
                <span className="log-message">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>

          {/* Stats */}
          <div className="execution-stats" role="group" aria-label="Deployment statistics">
            <div className="execution-stat">
              <div className="execution-stat-value" style={{ color: '#10b981' }}>
                {completedCount}
              </div>
              <div className="execution-stat-label">Ready</div>
            </div>
            <div className="execution-stat">
              <div className="execution-stat-value" style={{ color: '#3b82f6' }}>
                {executingCount}
              </div>
              <div className="execution-stat-label">Deploying</div>
            </div>
            <div className="execution-stat">
              <div className="execution-stat-value" style={{ color: '#9ca3af' }}>
                {pendingCount}
              </div>
              <div className="execution-stat-label">Pending</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard execution view
  return (
    <div
      ref={overlayRef}
      className="execution-overlay"
      role="status"
      aria-labelledby="execution-title"
      aria-describedby="execution-status"
      aria-live="polite"
      aria-busy="true"
      onMouseDown={handleMouseDown}
      style={{
        top: canvasTop ?? undefined,
        transform: dragOffset.x || dragOffset.y ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : undefined,
        cursor: isDragging ? 'grabbing' : 'move',
      }}
    >
      <div className="execution-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="execution-title" id="execution-title" style={{ marginBottom: 0 }}>Workflow Execution</div>
          {onClose && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              style={{
                background: 'transparent', border: 'none', color: '#9ca3af',
                cursor: 'pointer', fontSize: '16px', padding: '2px 6px',
                borderRadius: '4px', lineHeight: 1,
              }}
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
        <div className="execution-status" id="execution-status" role="status" aria-live="polite">
          {statusMessage}
        </div>

        <div className="execution-stats" role="group" aria-label="Execution statistics">
          <div className="execution-stat" role="status">
            <div
              className="execution-stat-value"
              style={{ color: '#10b981' }}
              aria-label={`${completedCount} nodes completed`}
            >
              {completedCount}
            </div>
            <div className="execution-stat-label" aria-hidden="true">Completed</div>
          </div>

          <div className="execution-stat" role="status">
            <div
              className="execution-stat-value"
              style={{ color: '#3b82f6' }}
              aria-label={`${executingCount} nodes currently executing`}
            >
              {executingCount}
            </div>
            <div className="execution-stat-label" aria-hidden="true">Executing</div>
          </div>

          <div className="execution-stat" role="status">
            <div
              className="execution-stat-value"
              style={{ color: '#9ca3af' }}
              aria-label={`${pendingCount} nodes pending execution`}
            >
              {pendingCount}
            </div>
            <div className="execution-stat-label" aria-hidden="true">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
});

ExecutionOverlay.displayName = 'ExecutionOverlay';
