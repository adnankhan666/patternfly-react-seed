import * as React from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { NodeData, Connection } from '../types';
import { buildExecutionOrder } from '../utils/workflowHelpers';

interface FlowParticle {
  id: string;
  connectionId: string;
  progress: number;
  direction: 'forward' | 'backward';
}

interface ExecutionParticle {
  id: string;
  connectionId: string;
  progress: number;
}

interface UseWorkflowExecutionReturn {
  isExecuting: boolean;
  executingNodes: Set<string>;
  completedNodes: Set<string>;
  activeConnections: Set<string>;
  particles: ExecutionParticle[];
  ongoingFlow: boolean;
  flowParticles: FlowParticle[];
  setOngoingFlow: React.Dispatch<React.SetStateAction<boolean>>;
  setFlowParticles: React.Dispatch<React.SetStateAction<FlowParticle[]>>;
  handleExecute: () => Promise<void>;
  startOngoingFlow: () => void;
  stopOngoingFlow: () => void;
}

export const useWorkflowExecution = (
  nodes: NodeData[],
  connections: Connection[],
  addAlert: (title: string, variant?: AlertVariant) => void
): UseWorkflowExecutionReturn => {
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [executingNodes, setExecutingNodes] = React.useState<Set<string>>(new Set());
  const [completedNodes, setCompletedNodes] = React.useState<Set<string>>(new Set());
  const [activeConnections, setActiveConnections] = React.useState<Set<string>>(new Set());
  const [particles, setParticles] = React.useState<ExecutionParticle[]>([]);
  const [ongoingFlow, setOngoingFlow] = React.useState(false);
  const [flowParticles, setFlowParticles] = React.useState<FlowParticle[]>([]);

  // Ref to store timeout ID for cleanup
  const ongoingFlowTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Start ongoing flow animation between connected nodes
  const startOngoingFlow = React.useCallback(() => {
    if (connections.length === 0) return;

    setOngoingFlow(true);

    // Animate ALL connections (removed filter and slice)
    const animatedConnections = connections;

    let animationFrame = 0;
    const animate = () => {
      // Check if animation should continue
      setOngoingFlow((currentFlow) => {
        if (!currentFlow) {
          if (ongoingFlowTimeoutRef.current) {
            clearTimeout(ongoingFlowTimeoutRef.current);
            ongoingFlowTimeoutRef.current = null;
          }
          return false;
        }

        const newParticles = animatedConnections.flatMap((conn, idx) => {
          // Create bidirectional particles with much slower movement
          // Divide by 200 instead of 100 for half speed
          const forwardProgress = ((animationFrame + idx * 40) % 200) / 200;
          const backwardProgress = ((animationFrame + idx * 40 + 100) % 200) / 200;

          return [
            {
              id: `flow-forward-${conn.id}-${animationFrame}`,
              connectionId: conn.id,
              progress: forwardProgress,
              direction: 'forward' as const,
            },
            {
              id: `flow-backward-${conn.id}-${animationFrame}`,
              connectionId: conn.id,
              progress: backwardProgress,
              direction: 'backward' as const,
            },
          ];
        });

        setFlowParticles(newParticles);
        animationFrame++;

        // Schedule next frame with cleanup tracking
        ongoingFlowTimeoutRef.current = setTimeout(animate, 100); // Even slower: 10 FPS
        return true;
      });
    };

    animate();
  }, [connections]);

  // Stop ongoing flow
  const stopOngoingFlow = React.useCallback(() => {
    setOngoingFlow(false);
    setFlowParticles([]);
    // Clear any pending timeout
    if (ongoingFlowTimeoutRef.current) {
      clearTimeout(ongoingFlowTimeoutRef.current);
      ongoingFlowTimeoutRef.current = null;
    }
  }, []);

  // Execute workflow
  const handleExecute = React.useCallback(async () => {
    if (nodes.length === 0) {
      addAlert('Cannot execute empty workflow. Add nodes first.', AlertVariant.warning);
      return;
    }

    if (isExecuting) {
      addAlert('Workflow is already executing', AlertVariant.warning);
      return;
    }

    setIsExecuting(true);
    setExecutingNodes(new Set());
    setCompletedNodes(new Set());
    setActiveConnections(new Set());
    setParticles([]);

    addAlert('Workflow execution started!', AlertVariant.info);

    const levels = buildExecutionOrder(nodes, connections);
    console.log('Execution order:', levels);

    // Execute nodes level by level
    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
      const level = levels[levelIndex];

      // Mark all nodes in this level as executing
      setExecutingNodes(new Set(level));

      // Simulate node execution (1.5 seconds per level)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mark nodes as completed
      setCompletedNodes(prev => {
        const newCompleted = new Set(prev);
        level.forEach(nodeId => newCompleted.add(nodeId));
        return newCompleted;
      });

      setExecutingNodes(new Set());

      // Animate connections to next level
      if (levelIndex < levels.length - 1) {
        const nextLevel = levels[levelIndex + 1];
        const activeConns = connections.filter(conn =>
          level.includes(conn.source) && nextLevel.includes(conn.target)
        );

        if (activeConns.length > 0) {
          setActiveConnections(new Set(activeConns.map(c => c.id)));

          // Create particles for each connection
          const newParticles = activeConns.map((conn, idx) => ({
            id: `particle-${conn.id}-${Date.now()}-${idx}`,
            connectionId: conn.id,
            progress: 0,
          }));

          setParticles(newParticles);

          // Animate particles
          const animationDuration = 1500; // 1.5 seconds (slower)
          const frameRate = 45; // Slightly lower frame rate
          const totalFrames = (animationDuration / 1000) * frameRate;

          for (let frame = 0; frame <= totalFrames; frame++) {
            await new Promise(resolve => setTimeout(resolve, 1000 / frameRate));
            const progress = frame / totalFrames;
            setParticles(newParticles.map(p => ({ ...p, progress })));
          }

          setParticles([]);
          setActiveConnections(new Set());
        }

        // Small delay between levels
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setIsExecuting(false);
    addAlert('Workflow execution completed!', AlertVariant.success);

    // Reset completed state after a delay
    setTimeout(() => {
      setCompletedNodes(new Set());
    }, 2000);

    // Start ongoing flow animation
    startOngoingFlow();
  }, [nodes, connections, isExecuting, addAlert, startOngoingFlow]);

  // Auto-start particle animation when connections exist
  React.useEffect(() => {
    if (connections.length > 0 && !ongoingFlow && !isExecuting) {
      startOngoingFlow();
    } else if (connections.length === 0 && ongoingFlow) {
      stopOngoingFlow();
    }
  }, [connections.length, ongoingFlow, isExecuting, startOngoingFlow, stopOngoingFlow]);

  // Stop ongoing flow when new execution starts
  React.useEffect(() => {
    if (isExecuting && ongoingFlow) {
      stopOngoingFlow();
    }
  }, [isExecuting, ongoingFlow, stopOngoingFlow]);

  // Cleanup ongoing flow animation on component unmount
  React.useEffect(() => {
    return () => {
      if (ongoingFlowTimeoutRef.current) {
        clearTimeout(ongoingFlowTimeoutRef.current);
        ongoingFlowTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    isExecuting,
    executingNodes,
    completedNodes,
    activeConnections,
    particles,
    ongoingFlow,
    flowParticles,
    setOngoingFlow,
    setFlowParticles,
    handleExecute,
    startOngoingFlow,
    stopOngoingFlow,
  };
};
