import * as React from 'react';
import { useMemo } from 'react';
import { Label } from '@patternfly/react-core';
import { NODE_TYPES, HELM_NODE_TYPES, WorkflowNode } from '../types';
import { getDeployedPlugins, PLUGIN_STATE_EVENT } from '../../../data/pluginRegistry';

interface NodePanelProps {
  onDragStart: (nodeType: WorkflowNode, e: React.DragEvent) => void;
  helmMode?: boolean;
}

const pluginNodeToWorkflowNode = (
  pluginId: string,
  pluginName: string,
  node: { type: string; label: string; color: string; description: string }
): WorkflowNode => ({
  id: `plugin-${pluginId}-${node.type}`,
  type: 'action',
  name: node.label,
  description: node.description,
  color: node.color,
  pluginSource: pluginName,
});

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

const NodePanel: React.FunctionComponent<NodePanelProps> = React.memo(({ onDragStart, helmMode = false }) => {
  const [deployedVersion, setDeployedVersion] = React.useState(0);

  React.useEffect(() => {
    const refresh = () => setDeployedVersion((v) => v + 1);
    window.addEventListener('storage', refresh);
    window.addEventListener(PLUGIN_STATE_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(PLUGIN_STATE_EVENT, refresh);
    };
  }, []);

  const baseNodeTypes = helmMode ? HELM_NODE_TYPES : NODE_TYPES;
  const panelTitle = helmMode ? 'Helm Resources' : 'Nodes';

  const pluginNodes = useMemo(() => {
    void deployedVersion;
    if (helmMode) return [];
    return getDeployedPlugins().flatMap((plugin) =>
      plugin.nodes.map((node) => pluginNodeToWorkflowNode(plugin.name, plugin.displayName, node))
    );
  }, [helmMode, deployedVersion]);

  const renderNode = (nodeType: WorkflowNode) => (
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
        }
      }}
    >
      <div className="node-type-name">
        {nodeType.name}
        {helmMode && <span className="k8s-badge">{getResourceKind(nodeType.id)}</span>}
        {nodeType.pluginSource && (
          <Label isCompact color="purple" style={{ fontSize: '0.65rem', marginLeft: 6, verticalAlign: 'middle' }}>
            {nodeType.pluginSource}
          </Label>
        )}
      </div>
      <div className="node-type-description">{nodeType.description}</div>
    </div>
  );

  return (
    <div className="node-panel" role="complementary" aria-label="Workflow node types panel">
      <h3 className="node-panel-title" id="node-panel-title">{panelTitle}</h3>
      <div className="node-list" role="list" aria-labelledby="node-panel-title">
        {baseNodeTypes.map(renderNode)}

        {pluginNodes.length > 0 && (
          <>
            <div className="node-panel-divider" role="separator">
              <span>Plugins</span>
            </div>
            {pluginNodes.map(renderNode)}
          </>
        )}
      </div>
    </div>
  );
});

NodePanel.displayName = 'NodePanel';

export { NodePanel };
