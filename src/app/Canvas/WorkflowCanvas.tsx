import * as React from 'react';
import { NodeData, Connection, NODE_TYPES, WorkflowNode } from './types';
import './WorkflowCanvas.css';

interface WorkflowCanvasProps {
  projectName: string;
}

export const WorkflowCanvas: React.FunctionComponent<WorkflowCanvasProps> = ({ projectName }) => {
  const [nodes, setNodes] = React.useState<NodeData[]>([]);
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const [draggedNode, setDraggedNode] = React.useState<NodeData | null>(null);
  const [connecting, setConnecting] = React.useState<{ sourceId: string; sourcePos: { x: number; y: number } } | null>(
    null,
  );
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
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

  // Handle connections
  const handleConnectionStart = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setConnecting({
      sourceId: nodeId,
      sourcePos: { x: node.position.x + 150, y: node.position.y + 40 },
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode) {
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

  const handleConnectionEnd = (targetNodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!connecting || connecting.sourceId === targetNodeId) {
      setConnecting(null);
      return;
    }

    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      source: connecting.sourceId,
      target: targetNodeId,
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

  const getNodeCenter = (node: NodeData) => ({
    x: node.position.x + 75,
    y: node.position.y + 40,
  });

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
        onMouseUp={handleNodeDragEnd}
      >
        <svg className="connections-layer">
          {/* Render connections */}
          {connections.map((conn) => {
            const sourceNode = nodes.find((n) => n.id === conn.source);
            const targetNode = nodes.find((n) => n.id === conn.target);
            if (!sourceNode || !targetNode) return null;

            const start = getNodeCenter(sourceNode);
            const end = getNodeCenter(targetNode);

            return (
              <line
                key={conn.id}
                x1={start.x + 75}
                y1={start.y}
                x2={end.x - 75}
                y2={end.y}
                stroke="#6b7280"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {/* Temporary connection line while dragging */}
          {connecting && (
            <line
              x1={connecting.sourcePos.x}
              y1={connecting.sourcePos.y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
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
            <div className="node-connectors">
              <div
                className="connector connector-input"
                onMouseUp={(e) => handleConnectionEnd(node.id, e)}
                title="Input"
              />
              <div
                className="connector connector-output"
                onMouseDown={(e) => handleConnectionStart(node.id, e)}
                title="Output"
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
