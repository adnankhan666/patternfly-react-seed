import * as React from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { NodeData, Connection } from '../types';
import { MAX_HISTORY_STEPS, ALERT_AUTO_DISMISS_MS } from '../constants';

interface AlertInfo {
  id: string;
  title: string;
  variant: AlertVariant;
}

interface WorkflowState {
  nodes: NodeData[];
  connections: Connection[];
}

interface UseWorkflowStateReturn {
  nodes: NodeData[];
  connections: Connection[];
  alerts: AlertInfo[];
  history: WorkflowState[];
  historyIndex: number;
  selectedNode: string | null;
  selectedNodes: Set<string>;
  copiedNodes: NodeData[];
  gridEnabled: boolean;
  connectionToDelete: string | null;
  nodeToDelete: string | null;
  draggedNode: NodeData | null;
  isDrawerExpanded: boolean;
  activeTab: string | number;
  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  setAlerts: React.Dispatch<React.SetStateAction<AlertInfo[]>>;
  setHistory: React.Dispatch<React.SetStateAction<WorkflowState[]>>;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  setSelectedNode: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  setCopiedNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
  setGridEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setConnectionToDelete: React.Dispatch<React.SetStateAction<string | null>>;
  setNodeToDelete: React.Dispatch<React.SetStateAction<string | null>>;
  setDraggedNode: React.Dispatch<React.SetStateAction<NodeData | null>>;
  setIsDrawerExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTab: React.Dispatch<React.SetStateAction<string | number>>;
  addAlert: (title: string, variant?: AlertVariant) => void;
  removeAlert: (id: string) => void;
  saveToHistory: (newNodes: NodeData[], newConnections: Connection[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const useWorkflowState = (gridEnabledDefault: boolean): UseWorkflowStateReturn => {
  const [nodes, setNodes] = React.useState<NodeData[]>([]);
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [alerts, setAlerts] = React.useState<AlertInfo[]>([]);
  const [history, setHistory] = React.useState<WorkflowState[]>([{ nodes: [], connections: [] }]);
  const [historyIndex, setHistoryIndex] = React.useState(0);
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = React.useState<Set<string>>(new Set());
  const [copiedNodes, setCopiedNodes] = React.useState<NodeData[]>([]);
  const [gridEnabled, setGridEnabled] = React.useState(gridEnabledDefault);
  const [connectionToDelete, setConnectionToDelete] = React.useState<string | null>(null);
  const [nodeToDelete, setNodeToDelete] = React.useState<string | null>(null);
  const [draggedNode, setDraggedNode] = React.useState<NodeData | null>(null);
  const [isDrawerExpanded, setIsDrawerExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string | number>(0);

  // Helper function to add alerts/toasts
  const addAlert = React.useCallback((title: string, variant: AlertVariant = AlertVariant.info) => {
    const id = `alert-${Date.now()}`;
    setAlerts((prevAlerts) => [...prevAlerts, { id, title, variant }]);
    // Auto-dismiss after configured time
    setTimeout(() => {
      setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
    }, ALERT_AUTO_DISMISS_MS);
  }, []);

  const removeAlert = React.useCallback((id: string) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
  }, []);

  // History management for undo/redo
  const saveToHistory = React.useCallback((newNodes: NodeData[], newConnections: Connection[]) => {
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push({ nodes: newNodes, connections: newConnections });
      // Limit history to max steps
      if (newHistory.length > MAX_HISTORY_STEPS) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY_STEPS - 1));
  }, [historyIndex]);

  const undo = React.useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setNodes(state.nodes);
      setConnections(state.connections);
      addAlert('Undo successful', AlertVariant.info);
    }
  }, [historyIndex, history, addAlert]);

  const redo = React.useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setNodes(state.nodes);
      setConnections(state.connections);
      addAlert('Redo successful', AlertVariant.info);
    }
  }, [historyIndex, history, addAlert]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    nodes,
    connections,
    alerts,
    history,
    historyIndex,
    selectedNode,
    selectedNodes,
    copiedNodes,
    gridEnabled,
    connectionToDelete,
    nodeToDelete,
    draggedNode,
    isDrawerExpanded,
    activeTab,
    setNodes,
    setConnections,
    setAlerts,
    setHistory,
    setHistoryIndex,
    setSelectedNode,
    setSelectedNodes,
    setCopiedNodes,
    setGridEnabled,
    setConnectionToDelete,
    setNodeToDelete,
    setDraggedNode,
    setIsDrawerExpanded,
    setActiveTab,
    addAlert,
    removeAlert,
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
