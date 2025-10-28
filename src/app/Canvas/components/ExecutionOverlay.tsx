import * as React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
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
}

export const ExecutionOverlay: React.FunctionComponent<ExecutionOverlayProps> = React.memo(({
  progress,
  executingCount,
  completedCount,
  totalNodes,
  statusMessage = 'Executing workflow...',
}) => {
  const pendingCount = totalNodes - completedCount - executingCount;

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
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
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
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
