import * as React from 'react';
import { NODE_TYPES, HELM_NODE_TYPES, WorkflowNode } from '../types';

interface NodePanelProps {
  onDragStart: (nodeType: WorkflowNode, e: React.DragEvent) => void;
  helmMode?: boolean;
}

export const NodePanel: React.FunctionComponent<NodePanelProps> = React.memo(({ onDragStart, helmMode = false }) => {
  const nodeTypes = helmMode ? HELM_NODE_TYPES : NODE_TYPES;
  const panelTitle = helmMode ? 'Helm Resources' : 'Nodes';
  
  return (
    <div className="node-panel" role="complementary" aria-label="Workflow node types panel">
      <h3 className="node-panel-title" id="node-panel-title">{panelTitle}</h3>
      <div className="node-list" role="list" aria-labelledby="node-panel-title">
        {nodeTypes.map((nodeType) => (
          <div
            key={nodeType.id}
            className="node-type"
            draggable
            onDragStart={(e) => onDragStart(nodeType, e)}
            style={{ borderLeftColor: nodeType.color }}
            role="listitem"
            aria-label={`${nodeType.name} node type: ${nodeType.description}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Keyboard users can still interact with draggable items
              }
            }}
          >
            <div className="node-type-name">
              {nodeType.name}
              {helmMode && <span className="k8s-badge">{getResourceKind(nodeType.id)}</span>}
            </div>
            <div className="node-type-description">{nodeType.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

NodePanel.displayName = 'NodePanel';

// Helper function to get Kubernetes resource kind for display
const getResourceKind = (nodeId: string): string => {
  const kindMap: Record<string, string> = {
    'oci-secret': 'Secret',
    'serving-runtime': 'ServingRuntime',
    'inference-service': 'InferenceService',
    'pvc': 'PVC',
    'rbac': 'RBAC',
    'notebook': 'Notebook',
    'job': 'Job',
  };
  return kindMap[nodeId] || '';
};
