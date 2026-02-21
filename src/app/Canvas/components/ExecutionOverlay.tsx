import * as React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { DeploymentStatus, PHASE_DESCRIPTIONS } from '../types/deploymentPhases';
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

  // Auto-scroll logs to bottom
  React.useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [deploymentStatus?.logs]);

  // Draggable state
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const overlayRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  }, [position]);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (isDragging && overlayRef.current) {
      const overlayRect = overlayRef.current.getBoundingClientRect();

      // Calculate new position
      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      // Define boundaries
      // Top boundary: below the header/toolbar and tabs area (approximately 250px from top)
      const minY = 250;
      // Left boundary: after the node panel (280px width) plus padding
      const minX = 300;
      // Right boundary: keep within viewport minus overlay width and some padding
      const maxX = window.innerWidth - overlayRect.width - 20;
      // Bottom boundary: keep within viewport minus overlay height and some padding
      const maxY = window.innerHeight - overlayRect.height - 20;

      // Constrain position within boundaries
      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));

      setPosition({
        x: newX,
        y: newY,
      });
    }
  }, [isDragging, dragStart]);

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

  // Render Helm deployment view
  if (deploymentStatus) {
    const phaseInfo = PHASE_DESCRIPTIONS[deploymentStatus.phase];
    const phasePercent = ((deploymentStatus.phase - 1) / deploymentStatus.totalPhases) * 100;

    return (
      <div
        ref={overlayRef}
        className="execution-overlay helm-deployment"
        role="status"
        aria-labelledby="deployment-title"
        aria-live="polite"
        onMouseDown={handleMouseDown}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'move',
          width: '900px',
          height: 'calc(100vh - 300px)',
          maxHeight: 'calc(100vh - 300px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="execution-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="execution-title" id="deployment-title">
              {phaseInfo.icon} Helm Deployment
            </div>
            {onClose && deploymentStatus.phase === 6 && (
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '0 4px',
                }}
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

          {/* Deployment Logs */}
          <div 
            className="deployment-logs" 
            role="log" 
            aria-live="polite" 
            aria-atomic="false"
            style={{
              flex: '1 1 auto',
              overflowY: 'scroll',
              overflowX: 'hidden',
              minHeight: 0,
              maxHeight: '100%',
            }}
          >
            {deploymentStatus.logs.slice(-10).map((log) => (
              <div
                key={log.id}
                className={`deployment-log-entry log-${log.type}`}
                role="status"
              >
                <span className="log-time">
                  {log.timestamp.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
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
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'move',
      }}
    >
      <div className="execution-info">
        <div className="execution-title" id="execution-title">Workflow Execution</div>
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
