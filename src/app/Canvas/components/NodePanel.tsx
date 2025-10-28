import * as React from 'react';
import { NODE_TYPES, WorkflowNode } from '../types';

interface NodePanelProps {
  onDragStart: (nodeType: WorkflowNode, e: React.DragEvent) => void;
}

export const NodePanel: React.FunctionComponent<NodePanelProps> = React.memo(({ onDragStart }) => {
  return (
    <div className="node-panel" role="complementary" aria-label="Workflow node types panel">
      <h3 className="node-panel-title" id="node-panel-title">Nodes</h3>
      <div className="node-list" role="list" aria-labelledby="node-panel-title">
        {NODE_TYPES.map((nodeType) => (
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
            <div className="node-type-name">{nodeType.name}</div>
            <div className="node-type-description">{nodeType.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

NodePanel.displayName = 'NodePanel';
