import { renderHook, act, waitFor } from '@testing-library/react';
import { AlertVariant } from '@patternfly/react-core';
import { useWorkflowState } from './useWorkflowState';
import { NodeData, Connection } from '../types';
import { MAX_HISTORY_STEPS, ALERT_AUTO_DISMISS_MS } from '../constants';

// Mock timers for testing alert auto-dismiss
jest.useFakeTimers();

describe('useWorkflowState', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should initialize with empty nodes and connections', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      expect(result.current.nodes).toEqual([]);
      expect(result.current.connections).toEqual([]);
    });

    it('should initialize with grid enabled when true is passed', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      expect(result.current.gridEnabled).toBe(true);
    });

    it('should initialize with grid disabled when false is passed', () => {
      const { result } = renderHook(() => useWorkflowState(false));

      expect(result.current.gridEnabled).toBe(false);
    });

    it('should initialize history with empty state', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      expect(result.current.history).toEqual([{ nodes: [], connections: [] }]);
      expect(result.current.historyIndex).toBe(0);
    });

    it('should initialize with no selected nodes', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      expect(result.current.selectedNode).toBeNull();
      expect(result.current.selectedNodes).toEqual(new Set());
    });

    it('should initialize with no copied nodes', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      expect(result.current.copiedNodes).toEqual([]);
    });

    it('should initialize with drawer collapsed', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      expect(result.current.isDrawerExpanded).toBe(false);
    });

    it('should initialize with first tab active', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      expect(result.current.activeTab).toBe(0);
    });
  });

  describe('State Setters', () => {
    it('should update nodes when setNodes is called', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      const testNode: NodeData = {
        id: 'test-node',
        type: 'test',
        label: 'Test Node',
        position: { x: 0, y: 0 },
        data: {},
      };

      act(() => {
        result.current.setNodes([testNode]);
      });

      expect(result.current.nodes).toEqual([testNode]);
    });

    it('should update connections when setConnections is called', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      const testConnection: Connection = {
        id: 'test-conn',
        source: 'node1',
        target: 'node2',
      };

      act(() => {
        result.current.setConnections([testConnection]);
      });

      expect(result.current.connections).toEqual([testConnection]);
    });

    it('should update selectedNode when setSelectedNode is called', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.setSelectedNode('node-123');
      });

      expect(result.current.selectedNode).toBe('node-123');
    });

    it('should update gridEnabled when setGridEnabled is called', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.setGridEnabled(false);
      });

      expect(result.current.gridEnabled).toBe(false);
    });

    it('should update isDrawerExpanded when setIsDrawerExpanded is called', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.setIsDrawerExpanded(true);
      });

      expect(result.current.isDrawerExpanded).toBe(true);
    });

    it('should update activeTab when setActiveTab is called', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.setActiveTab(1);
      });

      expect(result.current.activeTab).toBe(1);
    });
  });

  describe('Alert Management', () => {
    it('should add an alert with default info variant', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.addAlert('Test alert');
      });

      expect(result.current.alerts).toHaveLength(1);
      expect(result.current.alerts[0].title).toBe('Test alert');
      expect(result.current.alerts[0].variant).toBe(AlertVariant.info);
    });

    it('should add an alert with custom variant', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.addAlert('Success alert', AlertVariant.success);
      });

      expect(result.current.alerts).toHaveLength(1);
      expect(result.current.alerts[0].variant).toBe(AlertVariant.success);
    });

    it('should generate unique IDs for alerts', async () => {
      jest.useRealTimers(); // Use real timers for this test

      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.addAlert('Alert 1');
      });

      // Wait 2ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 2));

      act(() => {
        result.current.addAlert('Alert 2');
      });

      expect(result.current.alerts).toHaveLength(2);
      expect(result.current.alerts[0].id).not.toBe(result.current.alerts[1].id);

      jest.useFakeTimers(); // Restore fake timers for other tests
    });

    it('should auto-dismiss alerts after configured time', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.addAlert('Auto-dismiss alert');
      });

      expect(result.current.alerts).toHaveLength(1);

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(ALERT_AUTO_DISMISS_MS);
      });

      expect(result.current.alerts).toHaveLength(0);
    });

    it('should manually remove alert by ID', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.addAlert('Manual remove alert');
      });

      const alertId = result.current.alerts[0].id;

      act(() => {
        result.current.removeAlert(alertId);
      });

      expect(result.current.alerts).toHaveLength(0);
    });

    it('should handle removing non-existent alert gracefully', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.addAlert('Test alert');
      });

      act(() => {
        result.current.removeAlert('non-existent-id');
      });

      expect(result.current.alerts).toHaveLength(1);
    });
  });

  describe('History Management', () => {
    const testNode: NodeData = {
      id: 'node1',
      type: 'test',
      label: 'Node 1',
      position: { x: 0, y: 0 },
      data: {},
    };

    const testConnection: Connection = {
      id: 'conn1',
      source: 'node1',
      target: 'node2',
    };

    it('should save state to history', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.saveToHistory([testNode], [testConnection]);
      });

      expect(result.current.history).toHaveLength(2); // Initial empty + new state
      expect(result.current.historyIndex).toBe(1);
      expect(result.current.history[1]).toEqual({
        nodes: [testNode],
        connections: [testConnection],
      });
    });

    it('should truncate future history when saving after undo', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      // Add multiple states
      act(() => {
        result.current.setNodes([testNode]);
        result.current.saveToHistory([testNode], []);
      });

      act(() => {
        result.current.setNodes([testNode, testNode]);
        result.current.saveToHistory([testNode, testNode], []);
      });

      act(() => {
        result.current.setNodes([testNode, testNode, testNode]);
        result.current.saveToHistory([testNode, testNode, testNode], []);
      });

      expect(result.current.history).toHaveLength(4);
      expect(result.current.historyIndex).toBe(3);

      // Undo twice
      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.historyIndex).toBe(1);

      // Save new state (should truncate future history)
      const newNode: NodeData = {
        id: 'new-node',
        type: 'test',
        label: 'New Node',
        position: { x: 100, y: 100 },
        data: {},
      };

      act(() => {
        result.current.setNodes([newNode]);
        result.current.saveToHistory([newNode], []);
      });

      expect(result.current.history).toHaveLength(3); // Initial + first state + new state
      expect(result.current.historyIndex).toBe(2); // After truncation at index 1, saving adds at index 2
    });

    it('should limit history to MAX_HISTORY_STEPS', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      // Add MAX_HISTORY_STEPS + 1 states
      act(() => {
        for (let i = 0; i < MAX_HISTORY_STEPS; i++) {
          result.current.saveToHistory([{ ...testNode, id: `node-${i}` }], []);
        }
      });

      expect(result.current.history.length).toBeLessThanOrEqual(MAX_HISTORY_STEPS);
    });
  });

  describe('Undo/Redo Functionality', () => {
    const node1: NodeData = {
      id: 'node1',
      type: 'test',
      label: 'Node 1',
      position: { x: 0, y: 0 },
      data: {},
    };

    const node2: NodeData = {
      id: 'node2',
      type: 'test',
      label: 'Node 2',
      position: { x: 100, y: 100 },
      data: {},
    };

    it('should undo to previous state', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.setNodes([node1]);
        result.current.saveToHistory([node1], []);
      });

      act(() => {
        result.current.setNodes([node1, node2]);
        result.current.saveToHistory([node1, node2], []);
      });

      expect(result.current.nodes).toEqual([node1, node2]);

      act(() => {
        result.current.undo();
      });

      expect(result.current.nodes).toEqual([node1]);
      expect(result.current.historyIndex).toBe(1);
    });

    it('should redo to next state', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.setNodes([node1]);
        result.current.saveToHistory([node1], []);
      });

      act(() => {
        result.current.setNodes([node1, node2]);
        result.current.saveToHistory([node1, node2], []);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.nodes).toEqual([node1]);

      act(() => {
        result.current.redo();
      });

      expect(result.current.nodes).toEqual([node1, node2]);
      expect(result.current.historyIndex).toBe(2);
    });

    it('should not undo when at initial state', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      const initialHistoryIndex = result.current.historyIndex;

      act(() => {
        result.current.undo();
      });

      expect(result.current.historyIndex).toBe(initialHistoryIndex);
    });

    it('should not redo when at latest state', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.saveToHistory([node1], []);
      });

      const latestHistoryIndex = result.current.historyIndex;

      act(() => {
        result.current.redo();
      });

      expect(result.current.historyIndex).toBe(latestHistoryIndex);
    });

    it('should show undo alert on successful undo', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.saveToHistory([node1], []);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.alerts.some(alert => alert.title === 'Undo successful')).toBe(true);
    });

    it('should show redo alert on successful redo', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.setNodes([node1]);
        result.current.saveToHistory([node1], []);
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.alerts.some(alert => alert.title === 'Redo successful')).toBe(true);
    });
  });

  describe('canUndo and canRedo Flags', () => {
    it('should return false for canUndo at initial state', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      expect(result.current.canUndo).toBe(false);
    });

    it('should return true for canUndo after saving history', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.saveToHistory([], []);
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('should return false for canRedo at latest state', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.saveToHistory([], []);
      });

      expect(result.current.canRedo).toBe(false);
    });

    it('should return true for canRedo after undo', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      act(() => {
        result.current.setNodes([]);
        result.current.saveToHistory([], []);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);
    });
  });

  describe('State Persistence', () => {
    it('should maintain state consistency across operations', () => {
      const { result } = renderHook(() => useWorkflowState(true));

      const node: NodeData = {
        id: 'test',
        type: 'test',
        label: 'Test',
        position: { x: 0, y: 0 },
        data: {},
      };

      act(() => {
        result.current.setNodes([node]);
        result.current.saveToHistory([node], []);
        result.current.setSelectedNode('test');
        result.current.setGridEnabled(false);
        result.current.setIsDrawerExpanded(true);
      });

      expect(result.current.nodes).toEqual([node]);
      expect(result.current.selectedNode).toBe('test');
      expect(result.current.gridEnabled).toBe(false);
      expect(result.current.isDrawerExpanded).toBe(true);
    });
  });
});
