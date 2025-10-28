import * as React from 'react';
import { NodeData, Connection } from '../types';

interface WorkflowMinimapProps {
  nodes: NodeData[];
  connections: Connection[];
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  pan: { x: number; y: number };
  onViewportChange: (pan: { x: number; y: number }) => void;
}

export const WorkflowMinimap: React.FunctionComponent<WorkflowMinimapProps> = React.memo(({
  nodes,
  connections,
  canvasWidth,
  canvasHeight,
  zoom,
  pan,
  onViewportChange,
}) => {
  const minimapRef = React.useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  // Minimap dimensions
  const MINIMAP_WIDTH = 200;
  const MINIMAP_HEIGHT = 150;
  const MINIMAP_PADDING = 10;

  // Calculate bounding box of all nodes
  const { minX, minY, maxX, maxY, contentWidth, contentHeight } = React.useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: canvasWidth, maxY: canvasHeight, contentWidth: canvasWidth, contentHeight: canvasHeight };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      const nodeWidth = node.size?.width || 180;
      const nodeHeight = node.size?.height || 100;
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    // Add padding
    minX -= 50;
    minY -= 50;
    maxX += 50;
    maxY += 50;

    return {
      minX,
      minY,
      maxX,
      maxY,
      contentWidth: maxX - minX,
      contentHeight: maxY - minY,
    };
  }, [nodes, canvasWidth, canvasHeight]);

  // Scale factor to fit content in minimap
  const scale = React.useMemo(() => {
    return Math.min(
      (MINIMAP_WIDTH - MINIMAP_PADDING * 2) / contentWidth,
      (MINIMAP_HEIGHT - MINIMAP_PADDING * 2) / contentHeight
    );
  }, [contentWidth, contentHeight]);

  // Convert canvas coordinates to minimap coordinates
  const toMinimapCoords = React.useCallback((x: number, y: number) => {
    return {
      x: (x - minX) * scale + MINIMAP_PADDING,
      y: (y - minY) * scale + MINIMAP_PADDING,
    };
  }, [minX, minY, scale]);

  // Convert minimap coordinates to canvas coordinates
  const toCanvasCoords = React.useCallback((x: number, y: number) => {
    return {
      x: (x - MINIMAP_PADDING) / scale + minX,
      y: (y - MINIMAP_PADDING) / scale + minY,
    };
  }, [minX, minY, scale]);

  // Calculate viewport rectangle in minimap coordinates
  const viewportRect = React.useMemo(() => {
    const viewportWidth = canvasWidth / zoom;
    const viewportHeight = canvasHeight / zoom;

    // Top-left corner of viewport in canvas coordinates
    const viewportX = -pan.x / zoom;
    const viewportY = -pan.y / zoom;

    const topLeft = toMinimapCoords(viewportX, viewportY);
    const bottomRight = toMinimapCoords(viewportX + viewportWidth, viewportY + viewportHeight);

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }, [canvasWidth, canvasHeight, zoom, pan, toMinimapCoords]);

  // Handle minimap drag to pan viewport
  const handleMinimapMouseDown = React.useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!minimapRef.current) return;

    setIsDragging(true);

    const rect = minimapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to canvas coordinates
    const canvasCoords = toCanvasCoords(x, y);

    // Center the viewport on the clicked point
    const newPan = {
      x: -(canvasCoords.x * zoom - canvasWidth / 2),
      y: -(canvasCoords.y * zoom - canvasHeight / 2),
    };

    onViewportChange(newPan);
  }, [canvasWidth, canvasHeight, zoom, toCanvasCoords, onViewportChange]);

  const handleMinimapMouseMove = React.useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !minimapRef.current) return;

    const rect = minimapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const canvasCoords = toCanvasCoords(x, y);

    const newPan = {
      x: -(canvasCoords.x * zoom - canvasWidth / 2),
      y: -(canvasCoords.y * zoom - canvasHeight / 2),
    };

    onViewportChange(newPan);
  }, [isDragging, canvasWidth, canvasHeight, zoom, toCanvasCoords, onViewportChange]);

  const handleMinimapMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      className="workflow-minimap"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '2px solid #d1d5db',
        borderRadius: '8px',
        padding: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <svg
        ref={minimapRef}
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', display: 'block' }}
        onMouseDown={handleMinimapMouseDown}
        onMouseMove={handleMinimapMouseMove}
        onMouseUp={handleMinimapMouseUp}
        onMouseLeave={handleMinimapMouseUp}
      >
        {/* Background */}
        <rect
          x="0"
          y="0"
          width={MINIMAP_WIDTH}
          height={MINIMAP_HEIGHT}
          fill="#f3f4f6"
          rx="4"
        />

        {/* Render connections */}
        {connections.map((conn) => {
          const sourceNode = nodes.find((n) => n.id === conn.source);
          const targetNode = nodes.find((n) => n.id === conn.target);

          if (!sourceNode || !targetNode) return null;

          const sourceCenter = {
            x: sourceNode.position.x + (sourceNode.size?.width || 180) / 2,
            y: sourceNode.position.y + (sourceNode.size?.height || 100) / 2,
          };

          const targetCenter = {
            x: targetNode.position.x + (targetNode.size?.width || 180) / 2,
            y: targetNode.position.y + (targetNode.size?.height || 100) / 2,
          };

          const start = toMinimapCoords(sourceCenter.x, sourceCenter.y);
          const end = toMinimapCoords(targetCenter.x, targetCenter.y);

          return (
            <line
              key={conn.id}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="#9ca3af"
              strokeWidth="1"
              opacity="0.6"
            />
          );
        })}

        {/* Render nodes */}
        {nodes.map((node) => {
          const pos = toMinimapCoords(node.position.x, node.position.y);
          const width = (node.size?.width || 180) * scale;
          const height = (node.size?.height || 100) * scale;

          return (
            <rect
              key={node.id}
              x={pos.x}
              y={pos.y}
              width={Math.max(width, 2)}
              height={Math.max(height, 2)}
              fill={node.data?.color || '#3b82f6'}
              opacity="0.7"
              rx="1"
            />
          );
        })}

        {/* Viewport indicator */}
        <rect
          x={viewportRect.x}
          y={viewportRect.y}
          width={viewportRect.width}
          height={viewportRect.height}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          opacity="0.8"
          rx="2"
          pointerEvents="none"
        />
      </svg>
    </div>
  );
});

WorkflowMinimap.displayName = 'WorkflowMinimap';
