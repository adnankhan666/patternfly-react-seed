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
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
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
  SearchPlusIcon,
  SearchMinusIcon,
  CubesIcon,
  TimesIcon,
  MapIcon,
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
import { ExecutionOverlay, LoadingSpinner, WorkflowMinimap, TemplateSelector } from './components';
import { saveWorkflowState, loadWorkflowState } from '../../services/workflowService';
import { WorkflowTemplate } from '../../data/workflowTemplates';
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

  // Loading states for data operations
  const [isLoading, setIsLoading] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  // Execution animation state
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [executingNodes, setExecutingNodes] = React.useState<Set<string>>(new Set());
  const [completedNodes, setCompletedNodes] = React.useState<Set<string>>(new Set());
  const [activeConnections, setActiveConnections] = React.useState<Set<string>>(new Set());
  const [particles, setParticles] = React.useState<Array<{
    id: string;
    connectionId: string;
    progress: number;
  }>>([]);
  const [flowParticles, setFlowParticles] = React.useState<Array<{
    id: string;
    connectionId: string;
    progress: number;
    direction: 'forward' | 'backward';
  }>>([]);

  // Execution progress tracking
  const [executionProgress, setExecutionProgress] = React.useState(0);
  const [executionStatus, setExecutionStatus] = React.useState<string>('');

  // Zoom and pan state
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [previousZoom, setPreviousZoom] = React.useState(1);
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = React.useState(false);
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 2;

  // Zoom control handlers (memoized with useCallback)
  const handleZoomIn = React.useCallback(() => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, MAX_ZOOM));
  }, [MAX_ZOOM]);

  const handleZoomOut = React.useCallback(() => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, MIN_ZOOM));
  }, [MIN_ZOOM]);

  const handleResetZoom = React.useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Fit all nodes to view - center and zoom to show all nodes
  const fitToView = React.useCallback(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    // Calculate bounding box of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    nodes.forEach(node => {
      const nodeWidth = node.size?.width || DEFAULT_NODE_WIDTH;
      const nodeHeight = node.size?.height || DEFAULT_NODE_HEIGHT;
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const contentCenterX = minX + contentWidth / 2;
    const contentCenterY = minY + contentHeight / 2;

    // Get canvas dimensions
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;

    // Calculate zoom to fit all nodes with padding
    const padding = 100;
    const zoomX = (canvasWidth - padding * 2) / contentWidth;
    const zoomY = (canvasHeight - padding * 2) / contentHeight;
    const newZoom = Math.min(zoomX, zoomY, 1, MAX_ZOOM); // Don't zoom in beyond 100%

    // Calculate pan to center the content
    // The transform is: scale(zoom) translate(pan.x, pan.y)
    // So pan is applied AFTER zoom, meaning pan values are in scaled space
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;

    const newPan = {
      x: (canvasCenterX / newZoom) - contentCenterX,
      y: (canvasCenterY / newZoom) - contentCenterY,
    };

    setZoom(Math.max(newZoom, MIN_ZOOM));
    setPan(newPan);
  }, [nodes, MIN_ZOOM, MAX_ZOOM]);

  // Pan handlers for canvas dragging (memoized with useCallback)
  const handleCanvasPanStart = React.useCallback((e: React.MouseEvent) => {
    // Only pan if space bar is pressed or middle mouse button (button === 1)
    const target = e.target as HTMLElement;
    const isCanvasBackground = target.classList.contains('workflow-canvas') || target.classList.contains('canvas-content');

    if (isCanvasBackground && (spacePressed || e.button === 1)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  }, [spacePressed, pan.x, pan.y]);

  const handleCanvasPanMove = React.useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart.x, panStart.y]);

  const handleCanvasPanEnd = React.useCallback(() => {
    setIsPanning(false);
  }, []);

  // Mouse wheel zoom handler (Ctrl/Cmd + scroll only) (memoized with useCallback)
  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    // Only zoom if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (cmdOrCtrl) {
      e.preventDefault();
      // Zoom in/out with mouse wheel
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(Math.max(zoom + delta, MIN_ZOOM), MAX_ZOOM);
      setZoom(newZoom);
    }
  }, [zoom, MIN_ZOOM, MAX_ZOOM]);

  // Helper function to add alerts/toasts (memoized with useCallback)
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

  // Snap position to grid (memoized with useCallback)
  const snapToGrid = React.useCallback((x: number, y: number): { x: number; y: number } => {
    if (!gridEnabled) {
      return { x, y };
    }
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
    };
  }, [gridEnabled]);

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

  // Memoize undo/redo availability
  const canUndo = React.useMemo(() => historyIndex > 0, [historyIndex]);
  const canRedo = React.useMemo(() => historyIndex < history.length - 1, [historyIndex, history.length]);

  // Load available projects from localStorage
  React.useEffect(() => {
    const loadProjects = () => {
      try {
        // Scan localStorage for all workflow-* keys
        const projects: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);

          if (key && key.startsWith('workflow-')) {
            // Extract project name from key (remove 'workflow-' prefix)
            const extractedProjectName = key.substring('workflow-'.length);

            if (extractedProjectName && !projects.includes(extractedProjectName)) {
              projects.push(extractedProjectName);
            }
          }
        }

        // Always include the current project
        if (!projects.includes(projectName)) {
          projects.push(projectName);
        }

        // Sort projects alphabetically
        projects.sort();

        setAvailableProjects(projects);
      } catch (error) {
        console.error('Error loading projects:', error);
        setAvailableProjects([projectName]);
      }
    };

    loadProjects();
  }, [projectName]);

  // Load workflow from localStorage on mount
  React.useEffect(() => {
    const loadWorkflow = async () => {
      setIsLoading(true);
      try {
        const savedData = localStorage.getItem(`workflow-${projectName}`);
        if (savedData) {
          // Simulate network delay for realistic loading experience
          await new Promise(resolve => setTimeout(resolve, 500));

          const workflowData = JSON.parse(savedData);
          if (workflowData.nodes && workflowData.connections) {
            setNodes(workflowData.nodes);
            setConnections(workflowData.connections);
            saveToHistory(workflowData.nodes, workflowData.connections);

            // Fit nodes to view after loading (with a delay to ensure state is updated and canvas is ready)
            setTimeout(() => {
              if (workflowData.nodes.length > 0 && canvasRef.current) {
                fitToView();
              }
            }, 600);
          }
        }
      } catch (error) {
        console.error('Error loading workflow:', error);
        addAlert('Failed to load saved workflow', AlertVariant.warning);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectName]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Space bar for pan mode
      if (e.code === 'Space' && !spacePressed) {
        setSpacePressed(true);
        e.preventDefault();
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

    const handleKeyUp = (e: KeyboardEvent) => {
      // Release space bar
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedNode, selectedNodes, copiedNodes, nodes, connections, historyIndex, history, spacePressed]);

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

  // Auto-adjust zoom when drawer opens/closes
  React.useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    const drawerWidth = 400; // Drawer panel width
    const padding = 80; // Generous padding for better visibility

    if (isDrawerExpanded) {
      // Store current zoom before adjusting
      setPreviousZoom(zoom);

      // Calculate bounding box of all nodes
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      nodes.forEach(node => {
        const nodeWidth = node.size?.width || DEFAULT_NODE_WIDTH;
        const nodeHeight = node.size?.height || DEFAULT_NODE_HEIGHT;
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + nodeWidth);
        maxY = Math.max(maxY, node.position.y + nodeHeight);
      });

      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;

      // Available canvas space when drawer is open
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const availableWidth = canvasRect.width - drawerWidth - padding * 2;
      const availableHeight = canvasRect.height - padding * 2;

      // Calculate zoom to fit all nodes with better minimum
      const zoomX = availableWidth / contentWidth;
      const zoomY = availableHeight / contentHeight;
      const optimalZoom = Math.min(zoomX, zoomY, 1); // Don't zoom in, only out

      // Only shrink if necessary, and don't go below 0.6 (60%)
      const minimumComfortableZoom = 0.6;
      if (optimalZoom < zoom) {
        setZoom(Math.max(optimalZoom, minimumComfortableZoom));
      }
    } else {
      // Restore previous zoom when drawer closes
      setZoom(previousZoom);
    }
  }, [isDrawerExpanded, nodes]);

  // Map node types to their routes (memoized with useCallback)
  const getNodeRoute = React.useCallback((nodeType: string): string => {
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
  }, []);

  // Handle dragging from node panel (memoized with useCallback)
  const handleDragStart = React.useCallback((nodeType: WorkflowNode, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('nodeType', JSON.stringify(nodeType));
  }, []);

  // Handle drop on canvas (memoized with useCallback)
  const handleCanvasDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const nodeTypeData = e.dataTransfer.getData('nodeType');
    if (!nodeTypeData) return;

    const nodeType = JSON.parse(nodeTypeData) as WorkflowNode;
    const rect = canvasRef.current.getBoundingClientRect();

    // Convert mouse position to canvas coordinates (accounting for zoom and pan)
    const rawX = (e.clientX - rect.left - pan.x) / zoom;
    const rawY = (e.clientY - rect.top - pan.y) / zoom;

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
  }, [pan.x, pan.y, zoom, snapToGrid, nodes, connections, saveToHistory]);

  const handleCanvasDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle node dragging on canvas
  const [dragOffset, setDragOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleNodeDragStart = (node: NodeData, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvasRef.current) return;

    // Get the mouse position relative to the canvas (accounting for zoom and pan)
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - canvasRect.left - pan.x) / zoom;
    const mouseY = (e.clientY - canvasRect.top - pan.y) / zoom;

    // Calculate offset from mouse to node position
    const offsetX = mouseX - node.position.x;
    const offsetY = mouseY - node.position.y;
    setDragOffset({ x: offsetX, y: offsetY });

    setDraggedNode(node);
    setSelectedNode(node.id);
  };

  const handleNodeDrag = (e: React.MouseEvent) => {
    if (!draggedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();

    // Convert mouse position to canvas coordinates (accounting for zoom and pan)
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    // Calculate new position
    let x = mouseX - dragOffset.x;
    let y = mouseY - dragOffset.y;

    // Clamp position within canvas bounds (in canvas coordinates)
    const nodeWidth = draggedNode.size?.width || DEFAULT_NODE_WIDTH;
    const nodeHeight = draggedNode.size?.height || DEFAULT_NODE_HEIGHT;
    const maxX = (rect.width / zoom) - nodeWidth;
    const maxY = (rect.height / zoom) - nodeHeight;
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));

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
    if (isPanning) {
      handleCanvasPanMove(e);
    } else if (resizingNode) {
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

    // Allow multiple connections between nodes
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

  const toggleGrid = React.useCallback(() => {
    setGridEnabled(!gridEnabled);
  }, [gridEnabled]);

  // Track current workflow ID for database operations
  const [currentWorkflowId, setCurrentWorkflowId] = React.useState<string | null>(null);

  // Template selector state
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = React.useState(false);

  // Workflow deletion state
  const [workflowToDelete, setWorkflowToDelete] = React.useState<number | null>(null);

  // Project selector dropdown state
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = React.useState(false);
  const [availableProjects, setAvailableProjects] = React.useState<string[]>([]);

  // Minimap visibility state
  const [isMinimapOpen, setIsMinimapOpen] = React.useState(false);

  // Workflow tabs state
  const [activeWorkflowTab, setActiveWorkflowTab] = React.useState<string | number>(0);
  const [projectWorkflows, setProjectWorkflows] = React.useState<Array<{
    id: string;
    name: string;
    nodes: NodeData[];
    connections: Connection[];
  }>>([
    {
      id: 'workflow-1',
      name: 'Main Workflow',
      nodes: [],
      connections: [],
    },
  ]);

  // Handle workflow tab switching
  const handleWorkflowTabSwitch = React.useCallback((event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    const currentWorkflow = projectWorkflows[activeWorkflowTab as number];
    if (currentWorkflow) {
      // Save current workflow's state
      const updatedWorkflows = [...projectWorkflows];
      updatedWorkflows[activeWorkflowTab as number] = {
        ...currentWorkflow,
        nodes,
        connections,
      };
      setProjectWorkflows(updatedWorkflows);
    }

    // Switch to new workflow
    setActiveWorkflowTab(tabIndex);
    const newWorkflow = projectWorkflows[tabIndex as number];
    if (newWorkflow) {
      setNodes(newWorkflow.nodes);
      setConnections(newWorkflow.connections);
      saveToHistory(newWorkflow.nodes, newWorkflow.connections);

      // Fit to view after switching workflows
      setTimeout(() => {
        if (newWorkflow.nodes.length > 0) {
          fitToView();
        }
      }, 100);
    }
  }, [activeWorkflowTab, projectWorkflows, nodes, connections, saveToHistory, fitToView]);

  // Add new workflow tab
  const handleAddWorkflow = React.useCallback(() => {
    const newWorkflowId = `workflow-${Date.now()}`;
    const newWorkflow = {
      id: newWorkflowId,
      name: `Workflow ${projectWorkflows.length + 1}`,
      nodes: [],
      connections: [],
    };

    // Save current workflow state before switching
    const currentWorkflow = projectWorkflows[activeWorkflowTab as number];
    if (currentWorkflow) {
      const updatedWorkflows = [...projectWorkflows];
      updatedWorkflows[activeWorkflowTab as number] = {
        ...currentWorkflow,
        nodes,
        connections,
      };
      setProjectWorkflows([...updatedWorkflows, newWorkflow]);
    } else {
      setProjectWorkflows([...projectWorkflows, newWorkflow]);
    }

    // Switch to new workflow
    setActiveWorkflowTab(projectWorkflows.length);
    setNodes([]);
    setConnections([]);
    saveToHistory([], []);
    addAlert(`Created new workflow: ${newWorkflow.name}`, AlertVariant.success);
  }, [projectWorkflows, activeWorkflowTab, nodes, connections, saveToHistory, addAlert]);

  // Delete workflow tab
  const handleDeleteWorkflow = React.useCallback((workflowIndex: number) => {
    setWorkflowToDelete(workflowIndex);
  }, []);

  const confirmDeleteWorkflow = React.useCallback(() => {
    if (workflowToDelete === null) return;

    // Cannot delete if it's the last workflow
    if (projectWorkflows.length === 1) {
      addAlert('Cannot delete the last workflow', AlertVariant.warning);
      setWorkflowToDelete(null);
      return;
    }

    const deletedWorkflowName = projectWorkflows[workflowToDelete].name;
    const updatedWorkflows = projectWorkflows.filter((_, index) => index !== workflowToDelete);
    setProjectWorkflows(updatedWorkflows);

    // Adjust active tab if necessary
    if (activeWorkflowTab === workflowToDelete) {
      // If deleting active tab, switch to previous tab or first tab
      const newActiveTab = workflowToDelete > 0 ? workflowToDelete - 1 : 0;
      setActiveWorkflowTab(newActiveTab);
      const newWorkflow = updatedWorkflows[newActiveTab];
      if (newWorkflow) {
        setNodes(newWorkflow.nodes);
        setConnections(newWorkflow.connections);
        saveToHistory(newWorkflow.nodes, newWorkflow.connections);
      }
    } else if ((activeWorkflowTab as number) > workflowToDelete) {
      // If deleting a tab before the active one, decrement active tab index
      setActiveWorkflowTab((activeWorkflowTab as number) - 1);
    }

    setWorkflowToDelete(null);
    addAlert(`Deleted workflow: ${deletedWorkflowName}`, AlertVariant.success);
  }, [workflowToDelete, projectWorkflows, activeWorkflowTab, saveToHistory, addAlert]);

  // Handle project switching
  const handleProjectSwitch = React.useCallback((selectedProject: string) => {
    setIsProjectDropdownOpen(false);

    // Navigate to the project's canvas page
    navigate(`/canvas/${encodeURIComponent(selectedProject)}`);
    addAlert(`Switched to project: ${selectedProject}`, AlertVariant.info);
  }, [navigate, addAlert]);

  // Toolbar actions (memoized with useCallback)
  const handleSave = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Save to database via API
      const savedWorkflow = await saveWorkflowState(
        currentWorkflowId,
        projectName,
        `Workflow for ${projectName}`,
        nodes as any,
        connections as any
      );

      // Update current workflow ID
      if (!currentWorkflowId && savedWorkflow.id) {
        setCurrentWorkflowId(savedWorkflow.id);
      }

      // Also save to localStorage as backup
      const workflowData = {
        projectName,
        nodes,
        connections,
        timestamp: new Date().toISOString(),
        workflowId: savedWorkflow.id,
      };
      localStorage.setItem(`workflow-${projectName}`, JSON.stringify(workflowData));

      addAlert('Workflow saved successfully to database!', AlertVariant.success);
    } catch (error) {
      console.error('Error saving workflow:', error);
      // Fallback to localStorage only
      try {
        const workflowData = {
          projectName,
          nodes,
          connections,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(`workflow-${projectName}`, JSON.stringify(workflowData));

        addAlert('Workflow saved locally (database unavailable)', AlertVariant.warning);
      } catch (localError) {
        addAlert('Failed to save workflow. Please try again.', AlertVariant.danger);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkflowId, projectName, nodes, connections, addAlert]);

  // Memoize execution order (expensive topological sort)
  const executionOrder = React.useMemo(() => {
    if (nodes.length === 0) return [];

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
  }, [nodes, connections]);

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
    setExecutionProgress(0);
    setExecutionStatus('Initializing workflow execution...');

    addAlert('Workflow execution started!', AlertVariant.info);

    const totalNodes = nodes.length;

    // Execute nodes level by level
    for (let levelIndex = 0; levelIndex < executionOrder.length; levelIndex++) {
      const level = executionOrder[levelIndex];

      // Update status message
      setExecutionStatus(`Executing level ${levelIndex + 1} of ${executionOrder.length}...`);

      // Mark all nodes in this level as executing
      setExecutingNodes(new Set(level));

      // Simulate node execution (1.5 seconds per level)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mark nodes as completed
      setCompletedNodes(prev => {
        const newCompleted = new Set(prev);
        level.forEach(nodeId => newCompleted.add(nodeId));

        // Update progress based on completed nodes
        const progress = Math.round((newCompleted.size / totalNodes) * 100);
        setExecutionProgress(progress);

        return newCompleted;
      });

      setExecutingNodes(new Set());

      // Animate ALL outgoing connections from completed nodes in this level
      const completedNodeIds = new Set(level);
      const activeConns = connections.filter(conn => completedNodeIds.has(conn.source));

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
        const animationDuration = 1000; // 1 second
        const frameRate = 60;
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
      if (levelIndex < executionOrder.length - 1) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, isExecuting, executionOrder, connections, addAlert]);

  // Ref to track if ongoing animation should continue
  const ongoingFlowRef = React.useRef<boolean>(false);
  const animationFrameRef = React.useRef<number>(0);

  // Start ongoing flow animation between connected nodes
  const startOngoingFlow = React.useCallback(() => {
    if (connections.length === 0) {
      return;
    }

    ongoingFlowRef.current = true;
    animationFrameRef.current = 0;

    const animate = () => {
      if (!ongoingFlowRef.current) {
        setFlowParticles([]);
        return;
      }

      const newParticles = connections.flatMap((conn, idx) => {
        // Create bidirectional particles with faster movement
        const forwardProgress = ((animationFrameRef.current * 2 + idx * 40) % 200) / 200;
        const backwardProgress = ((animationFrameRef.current * 2 + idx * 40 + 100) % 200) / 200;

        return [
          {
            id: `flow-forward-${conn.id}-${animationFrameRef.current}`,
            connectionId: conn.id,
            progress: forwardProgress,
            direction: 'forward' as const,
          },
          {
            id: `flow-backward-${conn.id}-${animationFrameRef.current}`,
            connectionId: conn.id,
            progress: backwardProgress,
            direction: 'backward' as const,
          },
        ];
      });

      setFlowParticles(newParticles);
      animationFrameRef.current++;

      // Schedule next frame
      if (ongoingFlowRef.current) {
        setTimeout(animate, 20); // 50 FPS for smoother animation
      }
    };

    // Start animation
    animate();
  }, [connections]);

  // Stop ongoing flow
  const stopOngoingFlow = React.useCallback(() => {
    ongoingFlowRef.current = false;
    setFlowParticles([]);
  }, []);

  // Stop ongoing flow when new execution starts
  React.useEffect(() => {
    if (isExecuting) {
      stopOngoingFlow();
    }
  }, [isExecuting, stopOngoingFlow]);

  // Cleanup ongoing flow animation on component unmount
  React.useEffect(() => {
    return () => {
      ongoingFlowRef.current = false;
    };
  }, []);

  const handleClear = React.useCallback(() => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      setNodes([]);
      setConnections([]);
      setSelectedNode(null);
      saveToHistory([], []);
    }
  }, [saveToHistory]);

  const handleNew = React.useCallback(() => {
    handleClear();
  }, [handleClear]);

  // Handle template selection (memoized with useCallback)
  const handleSelectTemplate = React.useCallback((template: WorkflowTemplate) => {
    try {
      // Convert template nodes to NodeData format
      const templateNodes: NodeData[] = template.nodes.map((node) => ({
        id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: node.type,
        label: node.label,
        position: node.position,
        size: node.size || { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
        data: node.data || {},
      }));

      // Create a mapping from old IDs to new IDs
      const idMapping: Record<string, string> = {};
      template.nodes.forEach((oldNode, index) => {
        idMapping[oldNode.id] = templateNodes[index].id;
      });

      // Convert template connections with new node IDs
      const templateConnections: Connection[] = template.connections.map((conn) => ({
        id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: idMapping[conn.source],
        target: idMapping[conn.target],
        sourceConnector: conn.sourceConnector || 'right',
        targetConnector: conn.targetConnector || 'left',
      }));

      // Apply template to canvas
      setNodes(templateNodes);
      setConnections(templateConnections);
      saveToHistory(templateNodes, templateConnections);

      addAlert(`Template "${template.name}" loaded successfully!`, AlertVariant.success);

      // Fit to view after loading template
      setTimeout(() => {
        if (templateNodes.length > 0) {
          fitToView();
        }
      }, 100);

      // Track analytics
      if (window.mixpanel) {
        window.mixpanel.track('Template Applied', {
          templateId: template.id,
          templateName: template.name,
          templateCategory: template.category,
          nodeCount: templateNodes.length,
          connectionCount: templateConnections.length,
        });
      }
    } catch (error) {
      console.error('Error applying template:', error);
      addAlert('Failed to load template. Please try again.', AlertVariant.danger);
    }
  }, [saveToHistory, addAlert, fitToView]);

  // Export workflow to JSON file (memoized with useCallback)
  const handleExport = React.useCallback(async () => {
    setIsExporting(true);
    try {
      // Simulate processing time for realistic UX
      await new Promise(resolve => setTimeout(resolve, 300));

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
    } finally {
      setIsExporting(false);
    }
  }, [projectName, nodes, connections, addAlert]);

  // Import workflow from JSON file (memoized with useCallback)
  const handleImport = React.useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          // Simulate processing time for realistic UX
          await new Promise(resolve => setTimeout(resolve, 400));

          const workflowData = JSON.parse(event.target?.result as string);
          if (workflowData.nodes && workflowData.connections) {
            setNodes(workflowData.nodes);
            setConnections(workflowData.connections);
            saveToHistory(workflowData.nodes, workflowData.connections);
            addAlert('Workflow imported successfully!', AlertVariant.success);

            // Fit to view after importing
            setTimeout(() => {
              if (workflowData.nodes.length > 0) {
                fitToView();
              }
            }, 100);
          } else {
            addAlert('Invalid workflow file format', AlertVariant.danger);
          }
        } catch (error) {
          console.error('Import failed:', error);
          addAlert('Failed to import workflow', AlertVariant.danger);
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [saveToHistory, addAlert, fitToView]);

  // Node action handlers
  const handleNodeAction = (nodeId: string, action: 'launch' | 'chat' | 'reload', e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    switch (action) {
      case 'launch':
        const route = getNodeRoute(node.type);
        navigate(route);
        addAlert(`Navigating to ${node.label}`, AlertVariant.info);
        break;
      case 'chat':
        addAlert(`Chat with ${node.label} - This would open a chat interface to configure the node interactively.`, AlertVariant.info);
        break;
      case 'reload':
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
        <Card isCompact>
          <CardBody style={{ padding: '12px 16px' }}>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Dropdown
                  isOpen={isProjectDropdownOpen}
                  onSelect={() => setIsProjectDropdownOpen(false)}
                  onOpenChange={(isOpen: boolean) => setIsProjectDropdownOpen(isOpen)}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                      isExpanded={isProjectDropdownOpen}
                      style={{ fontSize: '1.25rem', fontWeight: 700 }}
                    >
                      {projectName}
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    {availableProjects.map((project) => (
                      <DropdownItem
                        key={project}
                        value={project}
                        onClick={() => handleProjectSwitch(project)}
                        isDisabled={project === projectName}
                      >
                        {project}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                </Dropdown>
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
                        <Button
                          variant="secondary"
                          icon={<CubesIcon />}
                          onClick={() => setIsTemplateSelectorOpen(true)}
                          title="Load a workflow template"
                        >
                          Load Template
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button variant="secondary" icon={<SaveIcon />} onClick={handleSave}>
                          Save
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button
                          variant="secondary"
                          icon={<DownloadIcon />}
                          onClick={handleExport}
                          isLoading={isExporting}
                          isDisabled={isExporting || isImporting || isLoading}
                        >
                          {isExporting ? 'Exporting...' : 'Export'}
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button
                          variant="secondary"
                          icon={<UploadIcon />}
                          onClick={handleImport}
                          isLoading={isImporting}
                          isDisabled={isImporting || isExporting || isLoading}
                        >
                          {isImporting ? 'Importing...' : 'Import'}
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button
                          variant="primary"
                          icon={<PlayIcon />}
                          onClick={handleExecute}
                          isDisabled={isExecuting || isImporting || isExporting || isLoading}
                        >
                          Execute
                        </Button>
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button variant="link" icon={<UndoIcon />} onClick={undo} isDisabled={!canUndo} aria-label="Undo" />
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button variant="link" icon={<RedoIcon />} onClick={redo} isDisabled={!canRedo} aria-label="Redo" />
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
                          aria-label={gridEnabled ? 'Disable grid' : 'Enable grid'}
                        />
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button
                          variant="link"
                          icon={<SearchPlusIcon />}
                          onClick={handleZoomIn}
                          isDisabled={zoom >= MAX_ZOOM}
                          aria-label="Zoom in"
                        />
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button
                          variant="link"
                          icon={<SearchMinusIcon />}
                          onClick={handleZoomOut}
                          isDisabled={zoom <= MIN_ZOOM}
                          aria-label="Zoom out"
                        />
                      </ToolbarItem>
                      <ToolbarItem>
                        <Button
                          variant={isMinimapOpen ? 'primary' : 'secondary'}
                          icon={<MapIcon />}
                          onClick={() => setIsMinimapOpen(!isMinimapOpen)}
                          aria-label={isMinimapOpen ? 'Hide minimap' : 'Show minimap'}
                          title={isMinimapOpen ? 'Hide minimap' : 'Show minimap'}
                        />
                      </ToolbarItem>
                    </ToolbarGroup>
                  </ToolbarContent>
                </Toolbar>
              </FlexItem>
            </Flex>
          </CardBody>
        </Card>
      </FlexItem>

      {/* Workflow Tabs */}
      <FlexItem>
        <Card isCompact>
          <CardBody style={{ padding: '8px 16px' }}>
            <Tabs
              activeKey={activeWorkflowTab}
              onSelect={handleWorkflowTabSwitch}
              aria-label="Workflow tabs"
              isBox
            >
              {projectWorkflows.map((workflow, index) => (
                <Tab
                  key={workflow.id}
                  eventKey={index}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TabTitleText>{workflow.name}</TabTitleText>
                      {projectWorkflows.length > 1 && (
                        <Button
                          variant="plain"
                          icon={<TimesIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWorkflow(index);
                          }}
                          size="sm"
                          aria-label={`Close ${workflow.name}`}
                          style={{ padding: '2px 4px', minWidth: 'auto' }}
                        />
                      )}
                    </div>
                  }
                />
              ))}
              <Tab
                eventKey="add-workflow"
                title={
                  <Button
                    variant="plain"
                    icon={<PlusIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddWorkflow();
                    }}
                    size="sm"
                  >
                    Add Workflow
                  </Button>
                }
                isAriaDisabled
              />
            </Tabs>
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
                  onMouseDown={handleCanvasPanStart}
                  onMouseMove={handleMouseMove}
                  onMouseUp={() => {
                    handleNodeDragEnd();
                    handleResizeEnd();
                    handleCanvasPanEnd();
                  }}
                  onMouseLeave={handleCanvasPanEnd}
                  onWheel={handleWheel}
                  style={{ cursor: isPanning ? 'grabbing' : spacePressed ? 'grab' : 'default' }}
                >
                  <div
                    className="canvas-content"
                    style={{
                      transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                      transformOrigin: 'top left',
                      transition: 'transform 0.3s ease',
                      width: '100%',
                      height: '100%',
                      position: 'relative',
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
            const isActive = activeConnections.has(conn.id);

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
                  stroke={isActive ? '#3b82f6' : '#6b7280'}
                  strokeWidth={isActive ? '3' : '2'}
                  fill="none"
                  markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                  style={{
                    pointerEvents: 'none',
                    transition: 'stroke 0.3s ease, stroke-width 0.3s ease'
                  }}
                  className={isActive ? 'connection-active' : ''}
                />
              </g>
            );
          })}

          {/* Render ongoing flow particles */}
          {flowParticles.map((particle) => {
            const conn = connections.find(c => c.id === particle.connectionId);
            if (!conn) return null;

            const sourceNode = nodes.find((n) => n.id === conn.source);
            const targetNode = nodes.find((n) => n.id === conn.target);
            if (!sourceNode || !targetNode) return null;

            // For backward particles, swap start and end points
            const isBackward = particle.direction === 'backward';
            const start = isBackward
              ? getConnectorPosition(targetNode, conn.targetConnector || 'left')
              : getConnectorPosition(sourceNode, conn.sourceConnector || 'right');
            const end = isBackward
              ? getConnectorPosition(sourceNode, conn.sourceConnector || 'right')
              : getConnectorPosition(targetNode, conn.targetConnector || 'left');

            const sourceConnector = isBackward ? conn.targetConnector : conn.sourceConnector;
            const targetConnector = isBackward ? conn.sourceConnector : conn.targetConnector;

            // Calculate point along the curve
            const t = particle.progress;
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const curveStrength = Math.min(distance / 2, 100);

            // Control points
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

            // Cubic bezier formula
            const particleX =
              Math.pow(1 - t, 3) * start.x +
              3 * Math.pow(1 - t, 2) * t * cp1x +
              3 * (1 - t) * Math.pow(t, 2) * cp2x +
              Math.pow(t, 3) * end.x;

            const particleY =
              Math.pow(1 - t, 3) * start.y +
              3 * Math.pow(1 - t, 2) * t * cp1y +
              3 * (1 - t) * Math.pow(t, 2) * cp2y +
              Math.pow(t, 3) * end.y;

            // Different colors for forward/backward
            const color = particle.direction === 'forward' ? '#10b981' : '#f59e0b';

            return (
              <g key={particle.id}>
                {/* Particle */}
                <circle
                  cx={particleX}
                  cy={particleY}
                  r="3"
                  fill={color}
                  opacity="0.7"
                />
              </g>
            );
          })}

          {/* Render animated particles */}
          {particles.map((particle) => {
            const conn = connections.find(c => c.id === particle.connectionId);
            if (!conn) return null;

            const sourceNode = nodes.find((n) => n.id === conn.source);
            const targetNode = nodes.find((n) => n.id === conn.target);
            if (!sourceNode || !targetNode) return null;

            const start = getConnectorPosition(sourceNode, conn.sourceConnector || 'right');
            const end = getConnectorPosition(targetNode, conn.targetConnector || 'left');

            // Calculate point along the curve using bezier formula
            const t = particle.progress;
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const curveStrength = Math.min(distance / 2, 100);

            // Control points
            let cp1x = start.x;
            let cp1y = start.y;
            let cp2x = end.x;
            let cp2y = end.y;

            if (conn.sourceConnector === 'right') {
              cp1x = start.x + curveStrength;
            } else if (conn.sourceConnector === 'left') {
              cp1x = start.x - curveStrength;
            } else if (conn.sourceConnector === 'top') {
              cp1y = start.y - curveStrength;
            } else if (conn.sourceConnector === 'bottom') {
              cp1y = start.y + curveStrength;
            }

            if (conn.targetConnector === 'right') {
              cp2x = end.x + curveStrength;
            } else if (conn.targetConnector === 'left') {
              cp2x = end.x - curveStrength;
            } else if (conn.targetConnector === 'top') {
              cp2y = end.y - curveStrength;
            } else if (conn.targetConnector === 'bottom') {
              cp2y = end.y + curveStrength;
            }

            // Cubic bezier formula
            const particleX =
              Math.pow(1 - t, 3) * start.x +
              3 * Math.pow(1 - t, 2) * t * cp1x +
              3 * (1 - t) * Math.pow(t, 2) * cp2x +
              Math.pow(t, 3) * end.x;

            const particleY =
              Math.pow(1 - t, 3) * start.y +
              3 * Math.pow(1 - t, 2) * t * cp1y +
              3 * (1 - t) * Math.pow(t, 2) * cp2y +
              Math.pow(t, 3) * end.y;

            return (
              <g key={particle.id}>
                {/* Particle glow effect */}
                <circle
                  cx={particleX}
                  cy={particleY}
                  r="8"
                  fill="#3b82f6"
                  opacity="0.3"
                />
                {/* Main particle */}
                <circle
                  cx={particleX}
                  cy={particleY}
                  r="4"
                  fill="#3b82f6"
                  className="flow-particle"
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

          {/* Arrow marker definitions */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
            </marker>
            <marker id="arrowhead-active" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
            </marker>
          </defs>
        </svg>

                  {/* Render nodes */}
                  {nodes.map((node) => {
                    const isExecuting = executingNodes.has(node.id);
                    const isCompleted = completedNodes.has(node.id);
                    return (
                    <div
                      key={node.id}
                      className={`workflow-node ${selectedNode === node.id ? 'selected' : ''} ${isExecuting ? 'executing' : ''} ${isCompleted ? 'completed' : ''}`}
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
                    );
                  })}

                  {nodes.length === 0 && (
                    <div className="canvas-empty-state">
                      <p>Drag and drop nodes from the left panel to start building your workflow</p>
                    </div>
                  )}

                  {/* Loading Overlay for Data Operations */}
                  {(isLoading || isImporting || isExporting) && (
                    <div className="execution-overlay">
                      <LoadingSpinner
                        size="large"
                        message={
                          isLoading
                            ? 'Loading workflow...'
                            : isImporting
                            ? 'Importing workflow...'
                            : 'Exporting workflow...'
                        }
                      />
                    </div>
                  )}
                  </div>

                  {/* Execution Progress Dialog - Fixed to top-right corner, outside transformed content */}
                  {isExecuting && (
                    <ExecutionOverlay
                      progress={executionProgress}
                      executingCount={executingNodes.size}
                      completedCount={completedNodes.size}
                      totalNodes={nodes.length}
                      statusMessage={executionStatus}
                    />
                  )}

                  {/* Workflow Minimap - outside transformed content */}
                  {isMinimapOpen && nodes.length > 0 && (
                    <WorkflowMinimap
                      nodes={nodes}
                      connections={connections}
                      canvasWidth={canvasRef.current?.clientWidth || 0}
                      canvasHeight={canvasRef.current?.clientHeight || 0}
                      zoom={zoom}
                      pan={pan}
                      onViewportChange={(newPan) => setPan(newPan)}
                    />
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

      {/* Workflow Deletion Confirmation Modal */}
      {workflowToDelete !== null && (
        <Modal
          variant={ModalVariant.small}
          title="Delete Workflow"
          isOpen={true}
          onClose={() => setWorkflowToDelete(null)}
        >
          <ModalBody>
            Are you sure you want to delete workflow "{projectWorkflows[workflowToDelete]?.name}"?
            All nodes and connections in this workflow will be lost. This action cannot be undone.
          </ModalBody>
          <div style={{ padding: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setWorkflowToDelete(null)}>
              No, Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeleteWorkflow}>
              Yes, Delete Workflow
            </Button>
          </div>
        </Modal>
      )}

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={isTemplateSelectorOpen}
        onClose={() => setIsTemplateSelectorOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

    </Flex>
  );
};
