import * as React from 'react';
import { NodeData, Connection, NODE_TYPES, WorkflowNode, ConnectorPosition } from './types';
import './WorkflowCanvas.css';

interface WorkflowCanvasProps {
  projectName: string;
}

export const WorkflowCanvas: React.FunctionComponent<WorkflowCanvasProps> = ({ projectName }) => {
  const [nodes, setNodes] = React.useState<NodeData[]>([]);
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const [draggedNode, setDraggedNode] = React.useState<NodeData | null>(null);
  const [connecting, setConnecting] = React.useState<{
    sourceId: string;
    sourceConnector: ConnectorPosition;
    sourcePos: { x: number; y: number };
  } | null>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [resizingNode, setResizingNode] = React.useState<{
    nodeId: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  // Handle dragging from node panel
  const handleDragStart = (nodeType: WorkflowNode, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('nodeType', JSON.stringify(nodeType));
  };

  // Handle drop on canvas
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const nodeTypeData = e.dataTransfer.getData('nodeType');
    if (!nodeTypeData) return;

    const nodeType = JSON.parse(nodeTypeData) as WorkflowNode;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode: NodeData = {
      id: `node-${Date.now()}`,
      type: nodeType.id,
      label: nodeType.name,
      position: { x, y },
      size: { width: 180, height: 100 },
      data: { color: nodeType.color, description: nodeType.description },
    };

    setNodes([...nodes, newNode]);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Handle node dragging on canvas
  const handleNodeDragStart = (node: NodeData, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedNode(node);
    setSelectedNode(node.id);
  };

  const handleNodeDrag = (e: React.MouseEvent) => {
    if (!draggedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNodes(
      nodes.map((n) =>
        n.id === draggedNode.id
          ? { ...n, position: { x: x - 75, y: y - 40 } } // Center the node on cursor
          : n,
      ),
    );
  };

  const handleNodeDragEnd = () => {
    setDraggedNode(null);
  };

  // Handle node resizing
  const handleResizeStart = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setResizingNode({
      nodeId,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startWidth: node.size?.width || 180,
      startHeight: node.size?.height || 100,
    });
  };

  const handleResize = (e: React.MouseEvent) => {
    if (!resizingNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const deltaX = currentX - resizingNode.startX;
    const deltaY = currentY - resizingNode.startY;

    const newWidth = Math.max(120, resizingNode.startWidth + deltaX);
    const newHeight = Math.max(60, resizingNode.startHeight + deltaY);

    setNodes(
      nodes.map((n) =>
        n.id === resizingNode.nodeId ? { ...n, size: { width: newWidth, height: newHeight } } : n,
      ),
    );
  };

  const handleResizeEnd = () => {
    setResizingNode(null);
  };

  // Get connector position coordinates
  const getConnectorPosition = (node: NodeData, connector: ConnectorPosition): { x: number; y: number } => {
    const nodeWidth = node.size?.width || 180;
    const nodeHeight = node.size?.height || 100;
    const nodeHeaderHeight = 30;
    const connectorOffset = 6;

    switch (connector) {
      case 'top':
        return { x: node.position.x + nodeWidth / 2, y: node.position.y - connectorOffset };
      case 'right':
        return { x: node.position.x + nodeWidth + connectorOffset, y: node.position.y + nodeHeight / 2 };
      case 'bottom':
        return { x: node.position.x + nodeWidth / 2, y: node.position.y + nodeHeight + connectorOffset };
      case 'left':
        return { x: node.position.x - connectorOffset, y: node.position.y + nodeHeight / 2 };
    }
  };

  // Handle connections
  const handleConnectionStart = (nodeId: string, connector: ConnectorPosition, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const connectorPos = getConnectorPosition(node, connector);
    setConnecting({
      sourceId: nodeId,
      sourceConnector: connector,
      sourcePos: connectorPos,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (resizingNode) {
      handleResize(e);
    } else if (draggedNode) {
      handleNodeDrag(e);
    }

    if (connecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleConnectionEnd = (targetNodeId: string, targetConnector: ConnectorPosition, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!connecting || connecting.sourceId === targetNodeId) {
      setConnecting(null);
      return;
    }

    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      source: connecting.sourceId,
      target: targetNodeId,
      sourceConnector: connecting.sourceConnector,
      targetConnector: targetConnector,
    };

    setConnections([...connections, newConnection]);
    setConnecting(null);
  };

  const handleCanvasClick = () => {
    setSelectedNode(null);
    setConnecting(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId));
    setConnections(connections.filter((c) => c.source !== nodeId && c.target !== nodeId));
    setSelectedNode(null);
  };

  const handleDeleteConnection = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnections(connections.filter((c) => c.id !== connectionId));
  };

  const getNodeCenter = (node: NodeData) => ({
    x: node.position.x + 75,
    y: node.position.y + 40,
  });

  // Generate curved path for connections
  const getCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    sourceConnector?: ConnectorPosition,
    targetConnector?: ConnectorPosition,
  ): string => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const curveStrength = Math.min(distance / 2, 100);

    // Determine control point offsets based on connector positions
    let cp1x = start.x;
    let cp1y = start.y;
    let cp2x = end.x;
    let cp2y = end.y;

    if (sourceConnector === 'right') {
      cp1x = start.x + curveStrength;
    } else if (sourceConnector === 'left') {
      cp1x = start.x - curveStrength;
    } else if (sourceConnector === 'top') {
      cp1y = start.y - curveStrength;
    } else if (sourceConnector === 'bottom') {
      cp1y = start.y + curveStrength;
    }

    if (targetConnector === 'right') {
      cp2x = end.x + curveStrength;
    } else if (targetConnector === 'left') {
      cp2x = end.x - curveStrength;
    } else if (targetConnector === 'top') {
      cp2y = end.y - curveStrength;
    } else if (targetConnector === 'bottom') {
      cp2y = end.y + curveStrength;
    }

    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
  };

  return (
    <div className="workflow-container">
      {/* Node Panel */}
      <div className="node-panel">
        <h3 className="node-panel-title">Nodes</h3>
        <div className="node-list">
          {NODE_TYPES.map((nodeType) => (
            <div
              key={nodeType.id}
              className="node-type"
              draggable
              onDragStart={(e) => handleDragStart(nodeType, e)}
              style={{ borderLeftColor: nodeType.color }}
            >
              <div className="node-type-name">{nodeType.name}</div>
              <div className="node-type-description">{nodeType.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="workflow-canvas"
        onDrop={handleCanvasDrop}
        onDragOver={handleCanvasDragOver}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={() => {
          handleNodeDragEnd();
          handleResizeEnd();
        }}
      >
        <svg className="connections-layer">
          {/* Render connections */}
          {connections.map((conn) => {
            const sourceNode = nodes.find((n) => n.id === conn.source);
            const targetNode = nodes.find((n) => n.id === conn.target);
            if (!sourceNode || !targetNode) return null;

            const start = getConnectorPosition(sourceNode, conn.sourceConnector || 'right');
            const end = getConnectorPosition(targetNode, conn.targetConnector || 'left');
            const pathData = getCurvedPath(start, end, conn.sourceConnector, conn.targetConnector);

            return (
              <g key={conn.id}>
                {/* Invisible wider path for easier clicking */}
                <path
                  d={pathData}
                  stroke="transparent"
                  strokeWidth="20"
                  fill="none"
                  style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                  onClick={(e) => handleDeleteConnection(conn.id, e)}
                />
                {/* Visible connection path */}
                <path
                  d={pathData}
                  stroke="#6b7280"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            );
          })}

          {/* Temporary connection line while dragging */}
          {connecting && (
            <path
              d={getCurvedPath(connecting.sourcePos, mousePos, connecting.sourceConnector)}
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
            />
          )}

          {/* Arrow marker definition */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
            </marker>
          </defs>
        </svg>

        {/* Render nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`workflow-node ${selectedNode === node.id ? 'selected' : ''}`}
            style={{
              left: node.position.x,
              top: node.position.y,
              width: node.size?.width || 180,
              height: node.size?.height || 100,
              borderColor: node.data?.color,
            }}
            onMouseDown={(e) => handleNodeDragStart(node, e)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNode(node.id);
            }}
          >
            <div className="node-header" style={{ backgroundColor: node.data?.color }}>
              <span className="node-label">{node.label}</span>
              <button
                className="node-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNode(node.id);
                }}
              >
                ✕
              </button>
            </div>
            <div className="node-body">{node.data?.description}</div>
            <div
              className="node-resize-handle"
              onMouseDown={(e) => handleResizeStart(node.id, e)}
              title="Resize"
            />
            <div className="node-connectors">
              <div
                className="connector connector-input"
                onMouseUp={(e) => handleConnectionEnd(node.id, 'left', e)}
                onMouseDown={(e) => handleConnectionStart(node.id, 'left', e)}
                title="Left"
              />
              <div
                className="connector connector-output"
                onMouseDown={(e) => handleConnectionStart(node.id, 'right', e)}
                onMouseUp={(e) => handleConnectionEnd(node.id, 'right', e)}
                title="Right"
              />
              <div
                className="connector connector-top"
                onMouseDown={(e) => handleConnectionStart(node.id, 'top', e)}
                onMouseUp={(e) => handleConnectionEnd(node.id, 'top', e)}
                title="Top"
              />
              <div
                className="connector connector-bottom"
                onMouseDown={(e) => handleConnectionStart(node.id, 'bottom', e)}
                onMouseUp={(e) => handleConnectionEnd(node.id, 'bottom', e)}
                title="Bottom"
              />
            </div>
          </div>
        ))}

        {nodes.length === 0 && (
          <div className="canvas-empty-state">
            <p>Drag and drop nodes from the left panel to start building your workflow</p>
          </div>
        )}
      </div>
    </div>
  );
};
