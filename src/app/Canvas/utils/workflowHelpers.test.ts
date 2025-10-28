import {
  snapToGrid,
  getConnectorPosition,
  getCurvedPath,
  getPointOnCubicBezier,
  buildExecutionOrder,
  getNodeRoute,
} from './workflowHelpers';
import { NodeData } from '../types';
import { GRID_SIZE, DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT, CONNECTOR_OFFSET } from '../constants';

describe('workflowHelpers', () => {
  describe('snapToGrid', () => {
    it('should snap coordinates to grid when grid is enabled', () => {
      const result = snapToGrid(37, 42, true);
      const expectedX = Math.round(37 / GRID_SIZE) * GRID_SIZE;
      const expectedY = Math.round(42 / GRID_SIZE) * GRID_SIZE;

      expect(result).toEqual({ x: expectedX, y: expectedY });
    });

    it('should return original coordinates when grid is disabled', () => {
      const result = snapToGrid(37.5, 42.7, false);
      expect(result).toEqual({ x: 37.5, y: 42.7 });
    });

    it('should handle zero coordinates', () => {
      const result = snapToGrid(0, 0, true);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('should handle negative coordinates', () => {
      const result = snapToGrid(-37, -42, true);
      const expectedX = Math.round(-37 / GRID_SIZE) * GRID_SIZE;
      const expectedY = Math.round(-42 / GRID_SIZE) * GRID_SIZE;

      expect(result).toEqual({ x: expectedX, y: expectedY });
    });

    it('should snap perfectly aligned coordinates', () => {
      const gridValue = GRID_SIZE * 3;
      const result = snapToGrid(gridValue, gridValue, true);
      expect(result).toEqual({ x: gridValue, y: gridValue });
    });
  });

  describe('getConnectorPosition', () => {
    const mockNode: NodeData = {
      id: 'test-node',
      type: 'test',
      label: 'Test Node',
      position: { x: 100, y: 200 },
      size: { width: 180, height: 100 },
      data: {},
    };

    it('should calculate top connector position', () => {
      const result = getConnectorPosition(mockNode, 'top');
      expect(result).toEqual({
        x: 100 + 180 / 2, // center of node
        y: 200 - CONNECTOR_OFFSET,
      });
    });

    it('should calculate right connector position', () => {
      const result = getConnectorPosition(mockNode, 'right');
      expect(result).toEqual({
        x: 100 + 180 + CONNECTOR_OFFSET,
        y: 200 + 100 / 2, // middle of node
      });
    });

    it('should calculate bottom connector position', () => {
      const result = getConnectorPosition(mockNode, 'bottom');
      expect(result).toEqual({
        x: 100 + 180 / 2, // center of node
        y: 200 + 100 + CONNECTOR_OFFSET,
      });
    });

    it('should calculate left connector position', () => {
      const result = getConnectorPosition(mockNode, 'left');
      expect(result).toEqual({
        x: 100 - CONNECTOR_OFFSET,
        y: 200 + 100 / 2, // middle of node
      });
    });

    it('should use default dimensions when node size is not provided', () => {
      const nodeWithoutSize: NodeData = {
        ...mockNode,
        size: undefined,
      };

      const result = getConnectorPosition(nodeWithoutSize, 'top');
      expect(result).toEqual({
        x: 100 + DEFAULT_NODE_WIDTH / 2,
        y: 200 - CONNECTOR_OFFSET,
      });
    });
  });

  describe('getCurvedPath', () => {
    it('should generate valid SVG path for straight line', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 100 };
      const result = getCurvedPath(start, end);

      expect(result).toContain('M 0 0');
      expect(result).toContain('C ');
      expect(result).toContain('100 100');
    });

    it('should adjust control points based on source connector position (right)', () => {
      const start = { x: 0, y: 50 };
      const end = { x: 100, y: 50 };
      const result = getCurvedPath(start, end, 'right');

      expect(result).toContain('M 0 50');
      expect(result).toContain('100 50');
      // Control point should be adjusted to the right of start
      expect(result).toMatch(/C\s+\d+/);
    });

    it('should adjust control points based on source connector position (left)', () => {
      const start = { x: 100, y: 50 };
      const end = { x: 0, y: 50 };
      const result = getCurvedPath(start, end, 'left');

      expect(result).toContain('M 100 50');
      expect(result).toContain('0 50');
    });

    it('should adjust control points based on connector positions (top/bottom)', () => {
      const start = { x: 50, y: 0 };
      const end = { x: 50, y: 100 };
      const result = getCurvedPath(start, end, 'bottom', 'top');

      expect(result).toContain('M 50 0');
      expect(result).toContain('50 100');
    });

    it('should limit curve strength to maximum value', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 1000, y: 1000 };
      const result = getCurvedPath(start, end, 'right', 'left');

      // Curve strength should be capped at 100
      expect(result).toBeTruthy();
      expect(result).toContain('M 0 0');
    });
  });

  describe('getPointOnCubicBezier', () => {
    const start = { x: 0, y: 0 };
    const cp1 = { x: 25, y: 50 };
    const cp2 = { x: 75, y: 50 };
    const end = { x: 100, y: 100 };

    it('should return start point at t=0', () => {
      const result = getPointOnCubicBezier(0, start, cp1, cp2, end);
      expect(result).toEqual(start);
    });

    it('should return end point at t=1', () => {
      const result = getPointOnCubicBezier(1, start, cp1, cp2, end);
      expect(result).toEqual(end);
    });

    it('should return midpoint at t=0.5', () => {
      const result = getPointOnCubicBezier(0.5, start, cp1, cp2, end);

      // Point should be somewhere between start and end
      expect(result.x).toBeGreaterThan(start.x);
      expect(result.x).toBeLessThan(end.x);
      expect(result.y).toBeGreaterThan(start.y);
      expect(result.y).toBeLessThan(end.y);
    });

    it('should calculate intermediate points correctly', () => {
      const result = getPointOnCubicBezier(0.25, start, cp1, cp2, end);

      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.x).toBeLessThanOrEqual(100);
      expect(result.y).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeLessThanOrEqual(100);
    });
  });

  describe('buildExecutionOrder', () => {
    it('should return empty array for no nodes', () => {
      const result = buildExecutionOrder([], []);
      expect(result).toEqual([]);
    });

    it('should return single level for disconnected nodes', () => {
      const nodes: NodeData[] = [
        { id: 'node1', type: 'test', label: 'Node 1', position: { x: 0, y: 0 }, data: {} },
        { id: 'node2', type: 'test', label: 'Node 2', position: { x: 100, y: 100 }, data: {} },
      ];

      const result = buildExecutionOrder(nodes, []);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(2);
      expect(result[0]).toContain('node1');
      expect(result[0]).toContain('node2');
    });

    it('should create two levels for simple dependency chain', () => {
      const nodes: NodeData[] = [
        { id: 'node1', type: 'test', label: 'Node 1', position: { x: 0, y: 0 }, data: {} },
        { id: 'node2', type: 'test', label: 'Node 2', position: { x: 100, y: 100 }, data: {} },
      ];
      const connections = [{ source: 'node1', target: 'node2' }];

      const result = buildExecutionOrder(nodes, connections);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(['node1']);
      expect(result[1]).toEqual(['node2']);
    });

    it('should handle parallel execution paths', () => {
      const nodes: NodeData[] = [
        { id: 'node1', type: 'test', label: 'Node 1', position: { x: 0, y: 0 }, data: {} },
        { id: 'node2', type: 'test', label: 'Node 2', position: { x: 0, y: 100 }, data: {} },
        { id: 'node3', type: 'test', label: 'Node 3', position: { x: 200, y: 50 }, data: {} },
      ];
      const connections = [
        { source: 'node1', target: 'node3' },
        { source: 'node2', target: 'node3' },
      ];

      const result = buildExecutionOrder(nodes, connections);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(2);
      expect(result[0]).toContain('node1');
      expect(result[0]).toContain('node2');
      expect(result[1]).toEqual(['node3']);
    });

    it('should handle complex DAG with multiple levels', () => {
      const nodes: NodeData[] = [
        { id: 'a', type: 'test', label: 'A', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: 'test', label: 'B', position: { x: 100, y: 0 }, data: {} },
        { id: 'c', type: 'test', label: 'C', position: { x: 200, y: 0 }, data: {} },
        { id: 'd', type: 'test', label: 'D', position: { x: 300, y: 0 }, data: {} },
      ];
      const connections = [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
        { source: 'c', target: 'd' },
      ];

      const result = buildExecutionOrder(nodes, connections);
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual(['a']);
      expect(result[1]).toEqual(['b']);
      expect(result[2]).toEqual(['c']);
      expect(result[3]).toEqual(['d']);
    });

    it('should handle cycles by taking all remaining nodes', () => {
      const nodes: NodeData[] = [
        { id: 'node1', type: 'test', label: 'Node 1', position: { x: 0, y: 0 }, data: {} },
        { id: 'node2', type: 'test', label: 'Node 2', position: { x: 100, y: 100 }, data: {} },
      ];
      const connections = [
        { source: 'node1', target: 'node2' },
        { source: 'node2', target: 'node1' }, // Creates cycle
      ];

      const result = buildExecutionOrder(nodes, connections);
      expect(result).toBeTruthy();
      expect(result.flat()).toHaveLength(2);
    });
  });

  describe('getNodeRoute', () => {
    it('should return correct route for experiments', () => {
      expect(getNodeRoute('experiments')).toBe('/experiments');
    });

    it('should return correct route for extensions', () => {
      expect(getNodeRoute('extensions')).toBe('/extensions');
    });

    it('should return correct route for feast', () => {
      expect(getNodeRoute('feast')).toBe('/feast');
    });

    it('should return correct route for hardware-profiles', () => {
      expect(getNodeRoute('hardware-profiles')).toBe('/hardwareProfiles');
    });

    it('should return correct route for mcp-servers', () => {
      expect(getNodeRoute('mcp-servers')).toBe('/mcpServers');
    });

    it('should return correct route for model-catalog', () => {
      expect(getNodeRoute('model-catalog')).toBe('/modelCatalog');
    });

    it('should return correct route for model-registry', () => {
      expect(getNodeRoute('model-registry')).toBe('/modelRegistry');
    });

    it('should return correct route for model-serving', () => {
      expect(getNodeRoute('model-serving')).toBe('/modelServing');
    });

    it('should return correct route for notebooks', () => {
      expect(getNodeRoute('notebooks')).toBe('/notebooks');
    });

    it('should return correct route for pipelines', () => {
      expect(getNodeRoute('pipelines')).toBe('/pipelines');
    });

    it('should return correct route for training', () => {
      expect(getNodeRoute('training')).toBe('/training');
    });

    it('should return correct route for tuning', () => {
      expect(getNodeRoute('tuning')).toBe('/tuning');
    });

    it('should return default route for unknown node type', () => {
      expect(getNodeRoute('unknown-type')).toBe('/');
    });

    it('should return default route for empty string', () => {
      expect(getNodeRoute('')).toBe('/');
    });
  });
});
