import { renderHook, act, waitFor } from '@testing-library/react';
import { AlertVariant } from '@patternfly/react-core';
import { useWorkflowExecution } from './useWorkflowExecution';
import { NodeData, Connection } from '../types';
import * as workflowHelpers from '../utils/workflowHelpers';

// Mock the workflowHelpers module
jest.mock('../utils/workflowHelpers', () => ({
  buildExecutionOrder: jest.fn(),
}));

// Mock timers for testing animations
jest.useFakeTimers();

describe('useWorkflowExecution', () => {
  let mockAddAlert: jest.Mock;
  const mockBuildExecutionOrder = workflowHelpers.buildExecutionOrder as jest.Mock;

  const testNodes: NodeData[] = [
    { id: 'node1', type: 'data-source', label: 'Node 1', position: { x: 0, y: 0 }, data: {} },
    { id: 'node2', type: 'transform', label: 'Node 2', position: { x: 100, y: 100 }, data: {} },
    { id: 'node3', type: 'output', label: 'Node 3', position: { x: 200, y: 200 }, data: {} },
  ];

  const testConnections: Connection[] = [
    { id: 'conn1', source: 'node1', target: 'node2' },
    { id: 'conn2', source: 'node2', target: 'node3' },
  ];

  beforeEach(() => {
    mockAddAlert = jest.fn();
    mockBuildExecutionOrder.mockClear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should initialize with isExecuting false', () => {
      const { result } = renderHook(() => useWorkflowExecution([], [], mockAddAlert));

      expect(result.current.isExecuting).toBe(false);
    });

    it('should initialize with empty executingNodes set', () => {
      const { result } = renderHook(() => useWorkflowExecution([], [], mockAddAlert));

      expect(result.current.executingNodes).toEqual(new Set());
    });

    it('should initialize with empty completedNodes set', () => {
      const { result } = renderHook(() => useWorkflowExecution([], [], mockAddAlert));

      expect(result.current.completedNodes).toEqual(new Set());
    });

    it('should initialize with empty activeConnections set', () => {
      const { result } = renderHook(() => useWorkflowExecution([], [], mockAddAlert));

      expect(result.current.activeConnections).toEqual(new Set());
    });

    it('should initialize with empty particles array', () => {
      const { result } = renderHook(() => useWorkflowExecution([], [], mockAddAlert));

      expect(result.current.particles).toEqual([]);
    });

    it('should initialize with ongoingFlow false', () => {
      const { result } = renderHook(() => useWorkflowExecution([], [], mockAddAlert));

      expect(result.current.ongoingFlow).toBe(false);
    });

    it('should initialize with empty flowParticles array', () => {
      const { result } = renderHook(() => useWorkflowExecution([], [], mockAddAlert));

      expect(result.current.flowParticles).toEqual([]);
    });
  });

  describe('State Setters', () => {
    it('should update ongoingFlow when setOngoingFlow is called', () => {
      const { result } = renderHook(() => useWorkflowExecution([], [], mockAddAlert));

      act(() => {
        result.current.setOngoingFlow(true);
      });

      expect(result.current.ongoingFlow).toBe(true);
    });

    it('should update flowParticles when setFlowParticles is called', () => {
      const { result } = renderHook(() => useWorkflowExecution([], [], mockAddAlert));

      const testParticles = [
        { id: 'p1', connectionId: 'conn1', progress: 0.5, direction: 'forward' as const },
      ];

      act(() => {
        result.current.setFlowParticles(testParticles);
      });

      expect(result.current.flowParticles).toEqual(testParticles);
    });
  });

  describe('Execution Validation', () => {
    it('should show alert when executing empty workflow', async () => {
      const { result } = renderHook(() => useWorkflowExecution([], [], mockAddAlert));

      await act(async () => {
        await result.current.handleExecute();
      });

      expect(mockAddAlert).toHaveBeenCalledWith(
        'Cannot execute empty workflow. Add nodes first.',
        AlertVariant.warning
      );
      expect(result.current.isExecuting).toBe(false);
    });

    it('should show alert when already executing', async () => {
      mockBuildExecutionOrder.mockReturnValue([['node1'], ['node2'], ['node3']]);

      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      // Start first execution (don't await)
      act(() => {
        result.current.handleExecute();
      });

      // Wait for execution to start
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isExecuting).toBe(true);

      // Try to start second execution
      await act(async () => {
        await result.current.handleExecute();
      });

      expect(mockAddAlert).toHaveBeenCalledWith(
        'Workflow is already executing',
        AlertVariant.warning
      );

      // Clean up the first execution
      act(() => {
        jest.runAllTimers();
      });
    });

    it('should call buildExecutionOrder with nodes and connections', async () => {
      mockBuildExecutionOrder.mockReturnValue([['node1']]);

      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      act(() => {
        result.current.handleExecute();
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockBuildExecutionOrder).toHaveBeenCalledWith(testNodes, testConnections);

      act(() => {
        jest.runAllTimers();
      });
    });
  });

  describe('Execution Flow', () => {
    it('should show start alert when execution begins', async () => {
      mockBuildExecutionOrder.mockReturnValue([['node1']]);

      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      act(() => {
        result.current.handleExecute();
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockAddAlert).toHaveBeenCalledWith(
        'Workflow execution started!',
        AlertVariant.info
      );

      act(() => {
        jest.runAllTimers();
      });
    });

    it('should set isExecuting to true during execution', async () => {
      mockBuildExecutionOrder.mockReturnValue([['node1']]);

      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      act(() => {
        result.current.handleExecute();
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isExecuting).toBe(true);

      act(() => {
        jest.runAllTimers();
      });
    });

    it('should reset state when execution starts', async () => {
      mockBuildExecutionOrder.mockReturnValue([['node1']]);

      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      // Set some initial state
      act(() => {
        result.current.setOngoingFlow(true);
      });

      act(() => {
        result.current.handleExecute();
      });

      await act(async () => {
        await Promise.resolve();
      });

      // State should be reset
      expect(result.current.executingNodes).toEqual(new Set());
      expect(result.current.completedNodes).toEqual(new Set());
      expect(result.current.activeConnections).toEqual(new Set());
      expect(result.current.particles).toEqual([]);

      act(() => {
        jest.runAllTimers();
      });
    });

    it('should show completion alert when execution finishes', async () => {
      mockBuildExecutionOrder.mockReturnValue([['node1']]);

      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      await act(async () => {
        await result.current.handleExecute();
      });

      expect(mockAddAlert).toHaveBeenCalledWith(
        'Workflow execution completed!',
        AlertVariant.success
      );
    });

    it('should set isExecuting to false after execution completes', async () => {
      mockBuildExecutionOrder.mockReturnValue([['node1']]);

      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      await act(async () => {
        await result.current.handleExecute();
      });

      expect(result.current.isExecuting).toBe(false);
    });
  });

  describe('Node Execution Levels', () => {
    it('should execute nodes in correct order', async () => {
      mockBuildExecutionOrder.mockReturnValue([['node1'], ['node2'], ['node3']]);

      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      act(() => {
        result.current.handleExecute();
      });

      // Wait for first level to start
      await act(async () => {
        await Promise.resolve();
      });

      // First level should be executing
      expect(result.current.executingNodes).toEqual(new Set(['node1']));

      // Advance past first level execution time (1500ms)
      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      // First level should be completed, second level executing
      expect(result.current.completedNodes).toContain('node1');

      act(() => {
        jest.runAllTimers();
      });
    });

    it('should mark nodes as completed after execution', async () => {
      mockBuildExecutionOrder.mockReturnValue([['node1'], ['node2']]);

      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      await act(async () => {
        await result.current.handleExecute();
      });

      expect(result.current.completedNodes).toContain('node1');
      expect(result.current.completedNodes).toContain('node2');
    });

    it('should clear executingNodes after level completes', async () => {
      mockBuildExecutionOrder.mockReturnValue([['node1']]);

      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      await act(async () => {
        await result.current.handleExecute();
      });

      expect(result.current.executingNodes).toEqual(new Set());
    });
  });

  describe('Ongoing Flow Animation', () => {
    beforeEach(() => {
      jest.useRealTimers();
    });

    afterEach(() => {
      jest.useFakeTimers();
    });

    it('should not start ongoing flow if no connections', () => {
      const { result } = renderHook(() => useWorkflowExecution(testNodes, [], mockAddAlert));

      act(() => {
        result.current.startOngoingFlow();
      });

      expect(result.current.ongoingFlow).toBe(false);
      expect(result.current.flowParticles).toEqual([]);
    });

    it('should set ongoingFlow to true when starting', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      act(() => {
        result.current.startOngoingFlow();
      });

      await waitFor(() => {
        expect(result.current.ongoingFlow).toBe(true);
      });

      // Cleanup
      act(() => {
        result.current.stopOngoingFlow();
      });
    });

    it('should create flow particles when ongoing flow is active', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      act(() => {
        result.current.startOngoingFlow();
      });

      await waitFor(
        () => {
          expect(result.current.flowParticles.length).toBeGreaterThan(0);
        },
        { timeout: 1000 }
      );

      // Cleanup
      act(() => {
        result.current.stopOngoingFlow();
      });
    });

    it('should clear flow particles when stopping ongoing flow', async () => {
      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      act(() => {
        result.current.startOngoingFlow();
      });

      await waitFor(() => {
        expect(result.current.ongoingFlow).toBe(true);
      });

      act(() => {
        result.current.stopOngoingFlow();
      });

      expect(result.current.ongoingFlow).toBe(false);
      expect(result.current.flowParticles).toEqual([]);
    });

    it('should stop ongoing flow when execution starts', async () => {
      mockBuildExecutionOrder.mockReturnValue([['node1']]);

      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      // Start ongoing flow
      act(() => {
        result.current.startOngoingFlow();
      });

      await waitFor(() => {
        expect(result.current.ongoingFlow).toBe(true);
      });

      // Start execution
      act(() => {
        result.current.handleExecute();
      });

      await waitFor(() => {
        expect(result.current.ongoingFlow).toBe(false);
      });
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      jest.useRealTimers();
    });

    afterEach(() => {
      jest.useFakeTimers();
    });

    it('should clean up ongoing flow on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      act(() => {
        result.current.startOngoingFlow();
      });

      await waitFor(() => {
        expect(result.current.ongoingFlow).toBe(true);
      });

      // Unmount should clear timeout
      unmount();

      // No errors should occur
    });
  });

  describe('useCallback Stability', () => {
    it('should return stable handleExecute function reference', () => {
      const { result, rerender } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      const firstHandleExecute = result.current.handleExecute;

      rerender();

      expect(result.current.handleExecute).toBe(firstHandleExecute);
    });

    it('should update handleExecute when nodes change', () => {
      const { result, rerender } = renderHook(
        ({ nodes }) => useWorkflowExecution(nodes, testConnections, mockAddAlert),
        { initialProps: { nodes: testNodes } }
      );

      const firstHandleExecute = result.current.handleExecute;

      const newNodes: NodeData[] = [
        ...testNodes,
        { id: 'node4', type: 'transform', label: 'Node 4', position: { x: 300, y: 300 }, data: {} },
      ];

      rerender({ nodes: newNodes });

      expect(result.current.handleExecute).not.toBe(firstHandleExecute);
    });

    it('should return stable startOngoingFlow function reference', () => {
      const { result, rerender } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      const firstStartOngoingFlow = result.current.startOngoingFlow;

      rerender();

      expect(result.current.startOngoingFlow).toBe(firstStartOngoingFlow);
    });

    it('should return stable stopOngoingFlow function reference', () => {
      const { result, rerender } = renderHook(() =>
        useWorkflowExecution(testNodes, testConnections, mockAddAlert)
      );

      const firstStopOngoingFlow = result.current.stopOngoingFlow;

      rerender();

      expect(result.current.stopOngoingFlow).toBe(firstStopOngoingFlow);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single node workflow', async () => {
      mockBuildExecutionOrder.mockReturnValue([['node1']]);

      const singleNode: NodeData[] = [testNodes[0]];

      const { result } = renderHook(() => useWorkflowExecution(singleNode, [], mockAddAlert));

      await act(async () => {
        await result.current.handleExecute();
      });

      expect(result.current.completedNodes).toContain('node1');
      expect(mockAddAlert).toHaveBeenCalledWith(
        'Workflow execution completed!',
        AlertVariant.success
      );
    });

    it('should handle parallel execution (multiple nodes in same level)', async () => {
      mockBuildExecutionOrder.mockReturnValue([['node1', 'node2', 'node3']]);

      const { result } = renderHook(() =>
        useWorkflowExecution(testNodes, [], mockAddAlert)
      );

      act(() => {
        result.current.handleExecute();
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.executingNodes).toEqual(new Set(['node1', 'node2', 'node3']));

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.completedNodes).toContain('node1');
      expect(result.current.completedNodes).toContain('node2');
      expect(result.current.completedNodes).toContain('node3');
    });

    it('should handle deep workflow with many levels', async () => {
      mockBuildExecutionOrder.mockReturnValue([
        ['node1'],
        ['node2'],
        ['node3'],
        ['node4'],
        ['node5'],
      ]);

      const deepNodes: NodeData[] = [
        ...testNodes,
        { id: 'node4', type: 'transform', label: 'Node 4', position: { x: 300, y: 300 }, data: {} },
        { id: 'node5', type: 'output', label: 'Node 5', position: { x: 400, y: 400 }, data: {} },
      ];

      const { result } = renderHook(() =>
        useWorkflowExecution(deepNodes, testConnections, mockAddAlert)
      );

      await act(async () => {
        await result.current.handleExecute();
      });

      expect(result.current.completedNodes.size).toBe(5);
    });
  });
});
