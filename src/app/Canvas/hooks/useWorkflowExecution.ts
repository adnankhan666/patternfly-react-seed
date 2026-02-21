import * as React from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { NodeData, Connection } from '../types';
import { buildExecutionOrder } from '../utils/workflowHelpers';
import {
  DeploymentLog,
  DeploymentStatus,
  NodeDeploymentStatus,
  DEPLOYMENT_PHASES,
  generateDeploymentLogs,
} from '../types/deploymentPhases';

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
  deploymentStatus: DeploymentStatus | null;
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
  const [deploymentStatus, setDeploymentStatus] = React.useState<DeploymentStatus | null>(null);

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

  // Helper to add deployment log
  const addDeploymentLog = React.useCallback((
    phase: number,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    nodeId?: string,
    nodeName?: string
  ) => {
    setDeploymentStatus(prev => {
      if (!prev) return null;
      return {
        ...prev,
        logs: [
          ...prev.logs,
          {
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            phase,
            nodeId,
            nodeName,
            message,
            type,
          },
        ],
      };
    });
  }, []);

  // Update node deployment status
  const updateNodeStatus = React.useCallback((
    nodeId: string,
    state: NodeDeploymentStatus['state'],
    message: string,
    substeps: string[] = [],
    currentSubstep?: number
  ) => {
    setDeploymentStatus(prev => {
      if (!prev) return null;
      const newStatuses = new Map(prev.nodeStatuses);
      newStatuses.set(nodeId, { state, message, substeps, currentSubstep });
      return { ...prev, nodeStatuses: newStatuses };
    });
  }, []);

  // Execute Helm deployment workflow with phases
  const executeHelmDeployment = React.useCallback(async () => {
    const helmNodes = nodes.filter(n => n.data?.helmConfig);
    
    // Initialize deployment status
    const initialStatus: DeploymentStatus = {
      phase: DEPLOYMENT_PHASES.VALIDATE,
      totalPhases: 6,
      currentPhaseProgress: 0,
      logs: [],
      nodeStatuses: new Map(),
    };
    
    helmNodes.forEach(node => {
      initialStatus.nodeStatuses.set(node.id, {
        state: 'pending',
        message: 'Waiting...',
        substeps: [],
      });
    });
    
    setDeploymentStatus(initialStatus);

    // PHASE 1: Validation (5s)
    addDeploymentLog(DEPLOYMENT_PHASES.VALIDATE, '🔍 Starting pre-flight validation...', 'info');
    
    for (const node of helmNodes) {
      updateNodeStatus(node.id, 'validating', 'Validating configuration...');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const resourceType = node.data?.helmConfig?.resourceType;
      const logs = generateDeploymentLogs(resourceType || '', node.label, DEPLOYMENT_PHASES.VALIDATE);
      
      for (const log of logs) {
        addDeploymentLog(DEPLOYMENT_PHASES.VALIDATE, log, 'info', node.id, node.label);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      updateNodeStatus(node.id, 'pending', 'Validated ✓');
      addDeploymentLog(DEPLOYMENT_PHASES.VALIDATE, `${node.label} validated successfully`, 'success', node.id, node.label);
    }
    
    addDeploymentLog(DEPLOYMENT_PHASES.VALIDATE, '✅ All validations passed', 'success');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // PHASE 2: Deploy Infrastructure (8s)
    setDeploymentStatus(prev => prev ? { ...prev, phase: DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE, currentPhaseProgress: 0 } : null);
    addDeploymentLog(DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE, '🏗️ Deploying infrastructure resources...', 'info');
    
    const infraNodes = helmNodes.filter(n =>
      ['oci-secret', 'serving-runtime', 'pvc', 'rbac'].includes(n.data?.helmConfig?.resourceType || '')
    );
    
    // Deploy infrastructure in parallel (visually)
    setExecutingNodes(new Set(infraNodes.map(n => n.id)));
    
    for (const node of infraNodes) {
      const resourceType = node.data?.helmConfig?.resourceType;
      const logs = generateDeploymentLogs(resourceType || '', node.label, DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE);
      
      updateNodeStatus(node.id, 'deploying', 'Deploying...', logs, 0);
      
      for (let i = 0; i < logs.length; i++) {
        addDeploymentLog(DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE, logs[i], 'info', node.id, node.label);
        updateNodeStatus(node.id, 'deploying', 'Deploying...', logs, i);
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      updateNodeStatus(node.id, 'ready', 'Deployed ✓');
      setCompletedNodes(prev => new Set([...prev, node.id]));
    }
    
    setExecutingNodes(new Set());
    addDeploymentLog(DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE, '✅ Infrastructure deployed successfully', 'success');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // PHASE 3: Deploy Services (10s)
    setDeploymentStatus(prev => prev ? { ...prev, phase: DEPLOYMENT_PHASES.DEPLOY_SERVICES, currentPhaseProgress: 0 } : null);
    addDeploymentLog(DEPLOYMENT_PHASES.DEPLOY_SERVICES, '🚀 Deploying services...', 'info');
    
    const serviceNodes = helmNodes.filter(n =>
      ['inference-service', 'notebook'].includes(n.data?.helmConfig?.resourceType || '')
    );
    
    setExecutingNodes(new Set(serviceNodes.map(n => n.id)));
    
    for (const node of serviceNodes) {
      const resourceType = node.data?.helmConfig?.resourceType;
      const logs = generateDeploymentLogs(resourceType || '', node.label, DEPLOYMENT_PHASES.DEPLOY_SERVICES);
      
      updateNodeStatus(node.id, 'deploying', 'Deploying...', logs, 0);
      
      for (let i = 0; i < logs.length; i++) {
        addDeploymentLog(DEPLOYMENT_PHASES.DEPLOY_SERVICES, logs[i], 'info', node.id, node.label);
        updateNodeStatus(node.id, 'deploying', 'Deploying...', logs, i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      updateNodeStatus(node.id, 'ready', 'Running ✓');
      setCompletedNodes(prev => new Set([...prev, node.id]));
    }
    
    setExecutingNodes(new Set());
    addDeploymentLog(DEPLOYMENT_PHASES.DEPLOY_SERVICES, '✅ Services deployed successfully', 'success');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // PHASE 4: Run Jobs (6s)
    setDeploymentStatus(prev => prev ? { ...prev, phase: DEPLOYMENT_PHASES.RUN_JOBS, currentPhaseProgress: 0 } : null);
    addDeploymentLog(DEPLOYMENT_PHASES.RUN_JOBS, '⚙️ Running initialization jobs...', 'info');
    
    const jobNodes = helmNodes.filter(n => n.data?.helmConfig?.resourceType === 'job');
    
    for (const node of jobNodes) {
      setExecutingNodes(new Set([node.id]));
      const logs = generateDeploymentLogs('job', node.label, DEPLOYMENT_PHASES.RUN_JOBS);
      
      updateNodeStatus(node.id, 'deploying', 'Running...', logs, 0);
      
      for (let i = 0; i < logs.length; i++) {
        addDeploymentLog(DEPLOYMENT_PHASES.RUN_JOBS, logs[i], 'info', node.id, node.label);
        updateNodeStatus(node.id, 'deploying', 'Running...', logs, i);
        await new Promise(resolve => setTimeout(resolve, 700));
      }
      
      updateNodeStatus(node.id, 'ready', 'Completed ✓');
      setCompletedNodes(prev => new Set([...prev, node.id]));
    }
    
    setExecutingNodes(new Set());
    addDeploymentLog(DEPLOYMENT_PHASES.RUN_JOBS, '✅ Jobs completed successfully', 'success');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // PHASE 5: Health Checks (4s)
    setDeploymentStatus(prev => prev ? { ...prev, phase: DEPLOYMENT_PHASES.HEALTH_CHECKS, currentPhaseProgress: 0 } : null);
    addDeploymentLog(DEPLOYMENT_PHASES.HEALTH_CHECKS, '🏥 Running health checks...', 'info');
    
    for (const node of serviceNodes) {
      const resourceType = node.data?.helmConfig?.resourceType;
      const logs = generateDeploymentLogs(resourceType || '', node.label, DEPLOYMENT_PHASES.HEALTH_CHECKS);
      
      for (const log of logs) {
        addDeploymentLog(DEPLOYMENT_PHASES.HEALTH_CHECKS, log, 'info', node.id, node.label);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    addDeploymentLog(DEPLOYMENT_PHASES.HEALTH_CHECKS, '✅ All health checks passed', 'success');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // PHASE 6: Ready (2s)
    setDeploymentStatus(prev => prev ? { ...prev, phase: DEPLOYMENT_PHASES.READY, currentPhaseProgress: 100 } : null);
    addDeploymentLog(DEPLOYMENT_PHASES.READY, '✅ Deployment complete! All services are ready.', 'success');
    
    const inferenceNode = helmNodes.find(n => n.data?.helmConfig?.resourceType === 'inference-service');
    const notebookNode = helmNodes.find(n => n.data?.helmConfig?.resourceType === 'notebook');
    
    if (inferenceNode) {
      const modelName = inferenceNode.data?.helmConfig?.values?.name || 'model';
      addDeploymentLog(DEPLOYMENT_PHASES.READY, `📡 Model endpoint: http://whisper-large-v3-predictor.whisper-proj.svc.cluster.local:8080/v1/audio/transcriptions`, 'success');
    }
    
    if (notebookNode) {
      addDeploymentLog(DEPLOYMENT_PHASES.READY, `📓 Notebook: https://rhods-dashboard/notebook/whisper-proj/whisper-workbench`, 'success');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }, [nodes, addDeploymentLog, updateNodeStatus]);

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
    setDeploymentStatus(null);

    // Check if this is a Helm workflow
    const isHelmWorkflow = nodes.some(n => n.data?.helmConfig);
    
    if (isHelmWorkflow) {
      addAlert('Starting Helm deployment...', AlertVariant.info);
      await executeHelmDeployment();
      setIsExecuting(false);
      addAlert('Deployment completed successfully!', AlertVariant.success);
      startOngoingFlow();
      return;
    }

    // Original execution for non-Helm workflows
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
  }, [nodes, connections, isExecuting, addAlert, startOngoingFlow, executeHelmDeployment]);

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
    deploymentStatus,
    setOngoingFlow,
    setFlowParticles,
    handleExecute,
    startOngoingFlow,
    stopOngoingFlow,
  };
};
