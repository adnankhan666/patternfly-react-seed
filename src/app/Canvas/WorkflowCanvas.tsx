import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  Flex,
  FlexItem,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  Button,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  DrawerHead,
  DrawerActions,
  DrawerCloseButton,
  Tabs,
  Tab,
  TabTitleText,
  FormGroup,
  TextInput,
  TextArea,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Modal,
  ModalVariant,
  ModalBody,
} from '@patternfly/react-core';
import {
  PlayIcon,
  SaveIcon,
  PlusIcon,
  UndoIcon,
  ExternalLinkAltIcon,
  CommentsIcon,
  RedoIcon,
  DownloadIcon,
  UploadIcon,
  ThIcon,
} from '@patternfly/react-icons';
import { Alert, AlertGroup, AlertActionCloseButton, AlertVariant } from '@patternfly/react-core';
import { NodeData, Connection, NODE_TYPES, WorkflowNode, ConnectorPosition } from './types';
import {
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  MIN_NODE_WIDTH,
  MIN_NODE_HEIGHT,
  NODE_HEADER_HEIGHT,
  CONNECTOR_OFFSET,
  MAX_HISTORY_STEPS,
  AUTO_SAVE_INTERVAL_MS,
  ALERT_AUTO_DISMISS_MS,
  PASTE_OFFSET_X,
  PASTE_OFFSET_Y,
  GRID_SIZE,
  GRID_ENABLED_DEFAULT,
} from './constants';
import './WorkflowCanvas.css';

interface WorkflowCanvasProps {
  projectName: string;
}

interface AlertInfo {
  id: string;
  title: string;
  variant: AlertVariant;
}

interface WorkflowState {
  nodes: NodeData[];
  connections: Connection[];
}

export const WorkflowCanvas: React.FunctionComponent<WorkflowCanvasProps> = ({ projectName }) => {
  const navigate = useNavigate();
  const [nodes, setNodes] = React.useState<NodeData[]>([]);
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [alerts, setAlerts] = React.useState<AlertInfo[]>([]);
  const [history, setHistory] = React.useState<WorkflowState[]>([{ nodes: [], connections: [] }]);
  const [historyIndex, setHistoryIndex] = React.useState(0);
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = React.useState<Set<string>>(new Set());
  const [copiedNodes, setCopiedNodes] = React.useState<NodeData[]>([]);
  const [gridEnabled, setGridEnabled] = React.useState(GRID_ENABLED_DEFAULT);
  const [connectionToDelete, setConnectionToDelete] = React.useState<string | null>(null);
  const [nodeToDelete, setNodeToDelete] = React.useState<string | null>(null);
  const [draggedNode, setDraggedNode] = React.useState<NodeData | null>(null);
  const [isDrawerExpanded, setIsDrawerExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string | number>(0);
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

  // Helper function to add alerts/toasts
  const addAlert = (title: string, variant: AlertVariant = AlertVariant.info) => {
    const id = `alert-${Date.now()}`;
    setAlerts((prevAlerts) => [...prevAlerts, { id, title, variant }]);
    // Auto-dismiss after configured time
    setTimeout(() => {
      setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
    }, ALERT_AUTO_DISMISS_MS);
  };

  const removeAlert = (id: string) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
  };

  // Snap position to grid
  const snapToGrid = (x: number, y: number): { x: number; y: number } => {
    if (!gridEnabled) {
      return { x, y };
    }
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
    };
  };

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

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setNodes(state.nodes);
      setConnections(state.connections);
      addAlert('Undo successful', AlertVariant.info);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setNodes(state.nodes);
      setConnections(state.connections);
      addAlert('Redo successful', AlertVariant.info);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Delete key - delete selected node
      if (e.key === 'Delete' && selectedNode) {
        e.preventDefault();
        handleDeleteNode(selectedNode);
        return;
      }

      // Escape key - deselect and cancel operations
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedNode(null);
        setSelectedNodes(new Set());
        setConnecting(null);
        setIsDrawerExpanded(false);
        return;
      }

      // Ctrl/Cmd + Z - Undo
      if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
      if ((cmdOrCtrl && e.shiftKey && e.key === 'z') || (cmdOrCtrl && e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl/Cmd + C - Copy selected node
      if (cmdOrCtrl && e.key === 'c' && selectedNode) {
        e.preventDefault();
        const nodeToCopy = nodes.find((n) => n.id === selectedNode);
        if (nodeToCopy) {
          setCopiedNodes([nodeToCopy]);
          addAlert('Node copied', AlertVariant.info);
        }
        return;
      }

      // Ctrl/Cmd + V - Paste copied node
      if (cmdOrCtrl && e.key === 'v' && copiedNodes.length > 0) {
        e.preventDefault();
        const newNodes = copiedNodes.map((node) => ({
          ...node,
          id: `node-${Date.now()}-${Math.random()}`,
          position: { x: node.position.x + PASTE_OFFSET_X, y: node.position.y + PASTE_OFFSET_Y },
        }));
        const updatedNodes = [...nodes, ...newNodes];
        setNodes(updatedNodes);
        saveToHistory(updatedNodes, connections);
        addAlert(`Pasted ${newNodes.length} node(s)`, AlertVariant.success);
        return;
      }

      // Ctrl/Cmd + S - Save
      if (cmdOrCtrl && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Ctrl/Cmd + A - Select all nodes
      if (cmdOrCtrl && e.key === 'a') {
        e.preventDefault();
        const allNodeIds = new Set(nodes.map((n) => n.id));
        setSelectedNodes(allNodeIds);
        addAlert('All nodes selected', AlertVariant.info);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode, selectedNodes, copiedNodes, nodes, connections, historyIndex, history]);

  // Auto-save functionality
  React.useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (nodes.length > 0 || connections.length > 0) {
        try {
          const workflowData = {
            projectName,
            nodes,
            connections,
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem(`workflow-${projectName}`, JSON.stringify(workflowData));
          console.log('Auto-saved workflow at', new Date().toLocaleTimeString());
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      clearInterval(autoSaveInterval);
    };
  }, [nodes, connections, projectName]);

  // Add/remove class to body when drawer opens/closes
  React.useEffect(() => {
    if (isDrawerExpanded) {
      document.body.classList.add('drawer-expanded');
    } else {
      document.body.classList.remove('drawer-expanded');
    }
    return () => {
      document.body.classList.remove('drawer-expanded');
    };
  }, [isDrawerExpanded]);

  // Map node types to their routes
  const getNodeRoute = (nodeType: string): string => {
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
    };
    return routeMap[nodeType] || '/';
  };

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
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // Snap to grid
    const { x, y } = snapToGrid(rawX, rawY);

    const newNode: NodeData = {
      id: `node-${Date.now()}`,
      type: nodeType.id,
      label: nodeType.name,
      position: { x, y },
      size: { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
      data: { color: nodeType.color, description: nodeType.description },
    };

    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    saveToHistory(newNodes, connections);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Handle node dragging on canvas
  const [dragOffset, setDragOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleNodeDragStart = (node: NodeData, e: React.MouseEvent) => {
    e.stopPropagation();
    // Calculate offset from mouse position to node top-left corner
    const nodeRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (canvasRect) {
      const offsetX = e.clientX - nodeRect.left;
      const offsetY = e.clientY - nodeRect.top;
      setDragOffset({ x: offsetX, y: offsetY });
    }
    setDraggedNode(node);
    setSelectedNode(node.id);
  };

  const handleNodeDrag = (e: React.MouseEvent) => {
    if (!draggedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left - dragOffset.x;
    let y = e.clientY - rect.top - dragOffset.y;

    // Clamp position within canvas bounds
    const nodeWidth = draggedNode.size?.width || DEFAULT_NODE_WIDTH;
    const nodeHeight = draggedNode.size?.height || DEFAULT_NODE_HEIGHT;
    x = Math.max(0, Math.min(x, rect.width - nodeWidth));
    y = Math.max(0, Math.min(y, rect.height - nodeHeight));

    setNodes(
      nodes.map((n) =>
        n.id === draggedNode.id
          ? { ...n, position: { x, y } }
          : n,
      ),
    );
  };

  const handleNodeDragEnd = () => {
    if (draggedNode && gridEnabled) {
      // Apply final snap to grid when drag ends
      const snappedNodes = nodes.map((n) => {
        if (n.id === draggedNode.id) {
          const snapped = snapToGrid(n.position.x, n.position.y);
          return { ...n, position: snapped };
        }
        return n;
      });
      setNodes(snappedNodes);
      saveToHistory(snappedNodes, connections);
    } else if (draggedNode) {
      saveToHistory(nodes, connections);
    }
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

    const newWidth = Math.max(MIN_NODE_WIDTH, resizingNode.startWidth + deltaX);
    const newHeight = Math.max(MIN_NODE_HEIGHT, resizingNode.startHeight + deltaY);

    setNodes(
      nodes.map((n) =>
        n.id === resizingNode.nodeId ? { ...n, size: { width: newWidth, height: newHeight } } : n,
      ),
    );
  };

  const handleResizeEnd = () => {
    if (resizingNode) {
      saveToHistory(nodes, connections);
    }
    setResizingNode(null);
  };

  // Get connector position coordinates
  const getConnectorPosition = (node: NodeData, connector: ConnectorPosition): { x: number; y: number } => {
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

    if (!connecting) {
      return;
    }

    // Prevent self-connections
    if (connecting.sourceId === targetNodeId) {
      addAlert('Cannot connect a node to itself', AlertVariant.warning);
      setConnecting(null);
      return;
    }

    // Check for duplicate connections
    const isDuplicate = connections.some(
      (conn) =>
        (conn.source === connecting.sourceId && conn.target === targetNodeId) ||
        (conn.source === targetNodeId && conn.target === connecting.sourceId)
    );

    if (isDuplicate) {
      addAlert('Connection already exists between these nodes', AlertVariant.warning);
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

    const newConnections = [...connections, newConnection];
    setConnections(newConnections);
    setConnecting(null);
    saveToHistory(nodes, newConnections);
    addAlert('Connection created', AlertVariant.success);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Don't close drawer if clicking on chatbot or drawer
    const target = e.target as HTMLElement;
    if (target.closest('.chat-bubble') || target.closest('.chat-window') || target.closest('.pf-v6-c-drawer__panel')) {
      return;
    }
    setSelectedNode(null);
    setConnecting(null);
    setIsDrawerExpanded(false);
  };

  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(nodeId);
    setIsDrawerExpanded(true);
    setActiveTab(0); // Reset to Properties tab
  };

  const handleDeleteNode = (nodeId: string) => {
    const newNodes = nodes.filter((n) => n.id !== nodeId);
    const newConnections = connections.filter((c) => c.source !== nodeId && c.target !== nodeId);
    setNodes(newNodes);
    setConnections(newConnections);
    setSelectedNode(null);
    saveToHistory(newNodes, newConnections);
  };

  const handleDeleteConnection = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectionToDelete(connectionId);
  };

  const confirmDeleteConnection = () => {
    if (!connectionToDelete) return;
    const newConnections = connections.filter((c) => c.id !== connectionToDelete);
    setConnections(newConnections);
    saveToHistory(nodes, newConnections);
    setConnectionToDelete(null);
    addAlert('Connection deleted', AlertVariant.success);
  };

  const toggleGrid = () => {
    setGridEnabled(!gridEnabled);
    addAlert(gridEnabled ? 'Grid disabled' : 'Grid enabled', AlertVariant.info);
  };

  // Toolbar actions
  const handleSave = () => {
    try {
      const workflowData = {
        projectName,
        nodes,
        connections,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(`workflow-${projectName}`, JSON.stringify(workflowData));
      console.log('Workflow saved:', workflowData);
      addAlert('Workflow saved successfully!', AlertVariant.success);
    } catch (error) {
      console.error('Error saving workflow:', error);
      addAlert('Failed to save workflow. Please try again.', AlertVariant.danger);
    }
  };

  const handleExecute = () => {
    if (nodes.length === 0) {
      addAlert('Cannot execute empty workflow. Add nodes first.', AlertVariant.warning);
      return;
    }
    console.log('Executing workflow with nodes:', nodes);
    console.log('Connections:', connections);
    addAlert('Workflow execution started! Check console for details.', AlertVariant.info);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      setNodes([]);
      setConnections([]);
      setSelectedNode(null);
      saveToHistory([], []);
    }
  };

  const handleNew = () => {
    handleClear();
  };

  // Export workflow to JSON file
  const handleExport = () => {
    try {
      const workflowData = {
        projectName,
        nodes,
        connections,
        timestamp: new Date().toISOString(),
        version: '1.0',
      };
      const dataStr = JSON.stringify(workflowData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workflow-${projectName}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addAlert('Workflow exported successfully!', AlertVariant.success);
    } catch (error) {
      console.error('Export failed:', error);
      addAlert('Failed to export workflow', AlertVariant.danger);
    }
  };

  // Import workflow from JSON file
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const workflowData = JSON.parse(event.target?.result as string);
          if (workflowData.nodes && workflowData.connections) {
            setNodes(workflowData.nodes);
            setConnections(workflowData.connections);
            saveToHistory(workflowData.nodes, workflowData.connections);
            addAlert('Workflow imported successfully!', AlertVariant.success);
          } else {
            addAlert('Invalid workflow file format', AlertVariant.danger);
          }
        } catch (error) {
          console.error('Import failed:', error);
          addAlert('Failed to import workflow', AlertVariant.danger);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Node action handlers
  const handleNodeAction = (nodeId: string, action: 'launch' | 'chat' | 'reload', e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    switch (action) {
      case 'launch':
        console.log(`Launching ${node.label} (${node.type})`);
        const route = getNodeRoute(node.type);
        navigate(route);
        addAlert(`Navigating to ${node.label}`, AlertVariant.info);
        break;
      case 'chat':
        console.log(`Opening chat for ${node.label}`);
        addAlert(`Chat with ${node.label} - This would open a chat interface to configure the node interactively.`, AlertVariant.info);
        break;
      case 'reload':
        console.log(`Reloading ${node.label}`);
        addAlert(`Reloading ${node.label} - Node status and configuration refreshed.`, AlertVariant.success);
        break;
    }
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
    <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }} style={{ height: '100%' }}>
      {/* Header with Toolbar */}
      <FlexItem>
        <Card>
          <CardBody>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Title headingLevel="h1" size="2xl">
                  {projectName}
                </Title>
              </FlexItem>
              <FlexItem>
                <Toolbar>
                  <ToolbarContent>
                    <ToolbarGroup>
                      <ToolbarItem>
                        <Button variant="secondary" icon={<PlusIcon />} onClick={handleNew}>
                          New
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button variant="secondary" icon={<SaveIcon />} onClick={handleSave}>
                          Save
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button variant="secondary" icon={<DownloadIcon />} onClick={handleExport}>
                          Export
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button variant="secondary" icon={<UploadIcon />} onClick={handleImport}>
                          Import
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button variant="primary" icon={<PlayIcon />} onClick={handleExecute}>
                          Execute
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button variant="link" icon={<UndoIcon />} onClick={undo} isDisabled={!canUndo}>
                          Undo
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button variant="link" icon={<RedoIcon />} onClick={redo} isDisabled={!canRedo}>
                          Redo
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button variant="link" onClick={handleClear}>
                          Clear
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button
                          variant={gridEnabled ? 'primary' : 'secondary'}
                          icon={<ThIcon />}
                          onClick={toggleGrid}
                          title={gridEnabled ? 'Disable grid' : 'Enable grid'}
                        >
                          Grid
                        </Button>
                      </ToolbarItem>
                    </ToolbarGroup>
                  </ToolbarContent>
                </Toolbar>
              </FlexItem>
            </Flex>
          </CardBody>
        </Card>
      </FlexItem>

      {/* Workflow Canvas */}
      <FlexItem flex={{ default: 'flex_1' }}>
        <Drawer isExpanded={isDrawerExpanded} isInline>
          <DrawerContent
            panelContent={
              selectedNode ? (
                <DrawerPanelContent defaultSize="400px">
                  <DrawerHead>
                    <Title headingLevel="h2" size="xl">
                      {nodes.find((n) => n.id === selectedNode)?.label || 'Node Details'}
                    </Title>
                    <DrawerActions>
                      <DrawerCloseButton onClick={() => setIsDrawerExpanded(false)} />
                    </DrawerActions>
                  </DrawerHead>
                  <DrawerContentBody>
                    <Tabs
                      activeKey={activeTab}
                      onSelect={(event, tabIndex) => setActiveTab(tabIndex)}
                      aria-label="Node details tabs"
                    >
                      <Tab eventKey={0} title={<TabTitleText>Properties</TabTitleText>}>
                        <div style={{ padding: '16px' }}>
                          {selectedNode && (() => {
                            const node = nodes.find((n) => n.id === selectedNode);
                            if (!node) return null;
                            return (
                              <>
                                <FormGroup label="Node ID">
                                  <TextInput value={node.id} isDisabled aria-label="Node ID" />
                                </FormGroup>
                                <FormGroup label="Type">
                                  <TextInput value={node.type} isDisabled aria-label="Node Type" />
                                </FormGroup>
                                <FormGroup label="Label">
                                  <TextInput
                                    value={node.label}
                                    onChange={(e, val) => {
                                      setNodes(
                                        nodes.map((n) =>
                                          n.id === selectedNode ? { ...n, label: val } : n,
                                        ),
                                      );
                                    }}
                                    aria-label="Node Label"
                                  />
                                </FormGroup>
                                <FormGroup label="Description">
                                  <TextArea
                                    value={node.data?.description || ''}
                                    onChange={(e, val) => {
                                      setNodes(
                                        nodes.map((n) =>
                                          n.id === selectedNode
                                            ? { ...n, data: { ...n.data, description: val } }
                                            : n,
                                        ),
                                      );
                                    }}
                                    aria-label="Node Description"
                                    rows={4}
                                  />
                                </FormGroup>
                                <FormGroup label="Position">
                                  <DescriptionList isHorizontal>
                                    <DescriptionListGroup>
                                      <DescriptionListTerm>X</DescriptionListTerm>
                                      <DescriptionListDescription>
                                        {Math.round(node.position.x)}px
                                      </DescriptionListDescription>
                                    </DescriptionListGroup>
                                    <DescriptionListGroup>
                                      <DescriptionListTerm>Y</DescriptionListTerm>
                                      <DescriptionListDescription>
                                        {Math.round(node.position.y)}px
                                      </DescriptionListDescription>
                                    </DescriptionListGroup>
                                  </DescriptionList>
                                </FormGroup>
                                <FormGroup label="Size">
                                  <DescriptionList isHorizontal>
                                    <DescriptionListGroup>
                                      <DescriptionListTerm>Width</DescriptionListTerm>
                                      <DescriptionListDescription>
                                        {node.size?.width || 180}px
                                      </DescriptionListDescription>
                                    </DescriptionListGroup>
                                    <DescriptionListGroup>
                                      <DescriptionListTerm>Height</DescriptionListTerm>
                                      <DescriptionListDescription>
                                        {node.size?.height || 100}px
                                      </DescriptionListDescription>
                                    </DescriptionListGroup>
                                  </DescriptionList>
                                </FormGroup>
                              </>
                            );
                          })()}
                        </div>
                      </Tab>
                      <Tab eventKey={1} title={<TabTitleText>Logs</TabTitleText>}>
                        <div style={{ padding: '16px' }}>
                          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                            No execution logs available for this node.
                          </p>
                          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '12px' }}>
                            Logs will appear here when the node is executed as part of a workflow run.
                          </p>
                        </div>
                      </Tab>
                    </Tabs>
                  </DrawerContentBody>
                </DrawerPanelContent>
              ) : undefined
            }
          >
            <DrawerContentBody>
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
                  className={`workflow-canvas ${!gridEnabled ? 'no-grid' : ''}`}
                  onDrop={handleCanvasDrop}
                  onDragOver={handleCanvasDragOver}
                  onClick={(e) => handleCanvasClick(e)}
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
                      onClick={(e) => handleNodeClick(node.id, e)}
                    >
                      {/* Action Bubbles */}
                      <div className="node-action-bubbles">
                        <button
                          className="action-bubble launch-bubble"
                          onClick={(e) => handleNodeAction(node.id, 'launch', e)}
                          title="Launch node"
                        >
                          <ExternalLinkAltIcon />
                        </button>
                        <button
                          className="action-bubble chat-bubble"
                          onClick={(e) => handleNodeAction(node.id, 'chat', e)}
                          title="Chat with node"
                        >
                          <CommentsIcon />
                        </button>
                        <button
                          className="action-bubble reload-bubble"
                          onClick={(e) => handleNodeAction(node.id, 'reload', e)}
                          title="Reload node"
                        >
                          <RedoIcon />
                        </button>
                      </div>

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
            </DrawerContentBody>
          </DrawerContent>
        </Drawer>
      </FlexItem>

      {/* Toast Notifications */}
      <AlertGroup isToast isLiveRegion style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 9999, maxWidth: '400px', opacity: 0.75 }}>
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            variant={alert.variant}
            title={alert.title}
            timeout={5000}
            actionClose={<AlertActionCloseButton onClose={() => removeAlert(alert.id)} />}
          />
        ))}
      </AlertGroup>

      {/* Connection Deletion Confirmation Modal */}
      {connectionToDelete && (
        <Modal
          variant={ModalVariant.small}
          title="Delete Connection"
          isOpen={true}
          onClose={() => setConnectionToDelete(null)}
        >
          <ModalBody>
            Are you sure you want to delete this connection? This action cannot be undone.
          </ModalBody>
          <div style={{ padding: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setConnectionToDelete(null)}>
              No, Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeleteConnection}>
              Yes, Delete
            </Button>
          </div>
        </Modal>
      )}

    </Flex>
  );
};
