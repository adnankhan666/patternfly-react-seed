import * as React from 'react';
import { ExternalLinkAltIcon, RedoIcon } from '@patternfly/react-icons';
import { NodeData } from '../types';

interface WorkflowNodeProps {
  node: NodeData;
  isSelected: boolean;
  isExecuting: boolean;
  isCompleted: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onConnectionStart: (connector: 'top' | 'right' | 'bottom' | 'left', e: React.MouseEvent) => void;
  onConnectionEnd: (connector: 'top' | 'right' | 'bottom' | 'left', e: React.MouseEvent) => void;
  onAction: (action: 'launch' | 'chat' | 'reload', e: React.MouseEvent) => void;
}

export const WorkflowNode: React.FunctionComponent<WorkflowNodeProps> = React.memo(({
  node,
  isSelected,
  isExecuting,
  isCompleted,
  onMouseDown,
  onClick,
  onDelete,
  onResizeStart,
  onConnectionStart,
  onConnectionEnd,
  onAction,
}) => {
  const nodeStatus = isExecuting ? 'executing' : isCompleted ? 'completed' : 'idle';
  const nodeStateLabel = isExecuting ? ', currently executing' : isCompleted ? ', completed' : '';
  
  // Detect if this is a Helm node
  const isHelmNode = !!node.data?.helmConfig;
  const helmConfig = node.data?.helmConfig;
  
  // Check if Helm node is configured (has required fields)
  const isConfigured = isHelmNode && helmConfig?.values && Object.keys(helmConfig.values).length > 0;
  const configStatus = isConfigured ? 'configured' : 'unconfigured';
  
  // Get resource kind for Helm nodes
  const getResourceKind = (type: string): string => {
    const kindMap: Record<string, string> = {
      'oci-secret': 'Secret',
      'serving-runtime': 'ServingRuntime',
      'inference-service': 'InferenceService',
      'pvc': 'PVC',
      'rbac': 'RBAC',
      'notebook': 'Notebook',
      'job': 'Job',
    };
    return kindMap[type] || '';
  };

  return (
    <div
      className={`workflow-node ${isSelected ? 'selected' : ''} ${isExecuting ? 'executing' : ''} ${isCompleted ? 'completed' : ''} ${isHelmNode ? 'helm-node' : ''}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size?.width || 180,
        height: node.size?.height || 100,
        borderColor: node.data?.color,
      }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${node.label} node${nodeStateLabel}. ${node.data?.description || ''}`}
      aria-selected={isSelected}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e as any);
        }
      }}
    >
      {/* Action Bubbles */}
      <div className="node-action-bubbles" role="group" aria-label="Node actions">
        <button
          className="action-bubble launch-bubble"
          onClick={(e) => onAction('launch', e)}
          title="Launch node"
          aria-label={`Launch ${node.label} node`}
        >
          <ExternalLinkAltIcon aria-hidden="true" />
        </button>
        <button
          className="action-bubble reload-bubble"
          onClick={(e) => onAction('reload', e)}
          title="Reload node"
          aria-label={`Reload ${node.label} node`}
        >
          <RedoIcon aria-hidden="true" />
        </button>
      </div>

      <div className="node-header" style={{ backgroundColor: node.data?.color }}>
        <span className="node-label" id={`node-label-${node.id}`}>
          {node.label}
          {isHelmNode && (
            <span className="k8s-resource-badge" title={`Kubernetes ${getResourceKind(node.type)}`}>
              {getResourceKind(node.type)}
            </span>
          )}
        </span>
        {isHelmNode && (
          <span 
            className={`config-status-indicator ${configStatus}`}
            title={isConfigured ? 'Configured' : 'Needs configuration'}
            aria-label={isConfigured ? 'Resource is configured' : 'Resource needs configuration'}
          />
        )}
        <button
          className="node-delete"
          onClick={onDelete}
          aria-label={`Delete ${node.label} node`}
        >
          ✕
        </button>
      </div>
      <div className="node-body" aria-label="Node description">{node.data?.description}</div>
      <div
        className="node-resize-handle"
        onMouseDown={onResizeStart}
        title="Resize"
        role="button"
        aria-label={`Resize ${node.label} node`}
        tabIndex={0}
      />
      <div className="node-connectors" role="group" aria-label="Node connectors">
        <div
          className="connector connector-input"
          onMouseUp={(e) => onConnectionEnd('left', e)}
          onMouseDown={(e) => onConnectionStart('left', e)}
          title="Left"
          role="button"
          aria-label={`Left connector of ${node.label}`}
          tabIndex={0}
        />
        <div
          className="connector connector-output"
          onMouseDown={(e) => onConnectionStart('right', e)}
          onMouseUp={(e) => onConnectionEnd('right', e)}
          title="Right"
          role="button"
          aria-label={`Right connector of ${node.label}`}
          tabIndex={0}
        />
        <div
          className="connector connector-top"
          onMouseDown={(e) => onConnectionStart('top', e)}
          onMouseUp={(e) => onConnectionEnd('top', e)}
          title="Top"
          role="button"
          aria-label={`Top connector of ${node.label}`}
          tabIndex={0}
        />
        <div
          className="connector connector-bottom"
          onMouseDown={(e) => onConnectionStart('bottom', e)}
          onMouseUp={(e) => onConnectionEnd('bottom', e)}
          title="Bottom"
          role="button"
          aria-label={`Bottom connector of ${node.label}`}
          tabIndex={0}
        />
      </div>
    </div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';
