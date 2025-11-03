import { NodeData, ConnectorPosition } from '../types';
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT, CONNECTOR_OFFSET, GRID_SIZE } from '../constants';

/**
 * Snap position to grid
 */
export const snapToGrid = (x: number, y: number, gridEnabled: boolean): { x: number; y: number } => {
  if (!gridEnabled) {
    return { x, y };
  }
  return {
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE,
  };
};

/**
 * Get connector position coordinates for a node
 */
export const getConnectorPosition = (node: NodeData, connector: ConnectorPosition): { x: number; y: number } => {
  const nodeWidth = node.size?.width || DEFAULT_NODE_WIDTH;
  const nodeHeight = node.size?.height || DEFAULT_NODE_HEIGHT;

  switch (connector) {
    case 'top':
      return { x: node.position.x + nodeWidth / 2, y: node.position.y - CONNECTOR_OFFSET };
    case 'right':
      return { x: node.position.x + nodeWidth + CONNECTOR_OFFSET, y: node.position.y + nodeHeight / 2 };
    case 'bottom':
      return { x: node.position.x + nodeWidth / 2, y: node.position.y + nodeHeight + CONNECTOR_OFFSET };
    case 'left':
      return { x: node.position.x - CONNECTOR_OFFSET, y: node.position.y + nodeHeight / 2 };
  }
};

/**
 * Generate curved path for connections using cubic bezier curves
 */
export const getCurvedPath = (
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

/**
 * Calculate point on cubic bezier curve
 */
export const getPointOnCubicBezier = (
  t: number,
  start: { x: number; y: number },
  cp1: { x: number; y: number },
  cp2: { x: number; y: number },
  end: { x: number; y: number }
): { x: number; y: number } => {
  const x =
    Math.pow(1 - t, 3) * start.x +
    3 * Math.pow(1 - t, 2) * t * cp1.x +
    3 * (1 - t) * Math.pow(t, 2) * cp2.x +
    Math.pow(t, 3) * end.x;

  const y =
    Math.pow(1 - t, 3) * start.y +
    3 * Math.pow(1 - t, 2) * t * cp1.y +
    3 * (1 - t) * Math.pow(t, 2) * cp2.y +
    Math.pow(t, 3) * end.y;

  return { x, y };
};

/**
 * Build execution order using topological sort
 */
export const buildExecutionOrder = (
  nodes: NodeData[],
  connections: Array<{ source: string; target: string }>
): string[][] => {
  const nodeIds = nodes.map(n => n.id);
  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, string[]> = {};

  // Initialize
  nodeIds.forEach(id => {
    inDegree[id] = 0;
    adjacency[id] = [];
  });

  // Build graph
  connections.forEach(conn => {
    adjacency[conn.source].push(conn.target);
    inDegree[conn.target] = (inDegree[conn.target] || 0) + 1;
  });

  // Topological sort by levels
  const levels: string[][] = [];
  const remaining = new Set(nodeIds);

  while (remaining.size > 0) {
    const currentLevel = Array.from(remaining).filter(id => inDegree[id] === 0);

    if (currentLevel.length === 0) {
      // If no nodes with 0 in-degree, take all remaining (handles cycles/disconnected nodes)
      levels.push(Array.from(remaining));
      break;
    }

    levels.push(currentLevel);
    currentLevel.forEach(id => {
      remaining.delete(id);
      adjacency[id].forEach(targetId => {
        inDegree[targetId]--;
      });
    });
  }

  return levels;
};

/**
 * Map node types to their routes
 */
export const getNodeRoute = (nodeType: string): string => {
  const routeMap: Record<string, string> = {
    experiments: '/experiments',
    extensions: '/extensions',
    feast: '/feast',
    'hardware-profiles': '/hardwareProfiles',
    'mcp-servers': '/mcpServers',
    'model-catalog': '/modelCatalog',
    'model-registry': '/modelRegistry',
    'model-serving': '/modelServing',
    notebooks: '/notebooks',
    pipelines: '/pipelines',
    training: '/training',
    tuning: '/tuning',
    telemetry: '/telemetry',
  };
  return routeMap[nodeType] || '/';
};
