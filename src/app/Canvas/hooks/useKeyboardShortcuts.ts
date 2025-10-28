import * as React from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { NodeData, Connection } from '../types';
import { PASTE_OFFSET_X, PASTE_OFFSET_Y } from '../constants';

interface UseKeyboardShortcutsParams {
  selectedNode: string | null;
  selectedNodes: Set<string>;
  copiedNodes: NodeData[];
  nodes: NodeData[];
  connections: Connection[];
  spacePressed: boolean;
  setSpacePressed: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedNode: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  setCopiedNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
  setConnecting: React.Dispatch<React.SetStateAction<any>>;
  setIsDrawerExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
  handleDeleteNode: (nodeId: string) => void;
  handleSave: () => void;
  undo: () => void;
  redo: () => void;
  saveToHistory: (nodes: NodeData[], connections: Connection[]) => void;
  addAlert: (title: string, variant?: AlertVariant) => void;
}

export const useKeyboardShortcuts = ({
  selectedNode,
  selectedNodes,
  copiedNodes,
  nodes,
  connections,
  spacePressed,
  setSpacePressed,
  setIsPanning,
  setSelectedNode,
  setSelectedNodes,
  setCopiedNodes,
  setConnecting,
  setIsDrawerExpanded,
  setNodes,
  handleDeleteNode,
  handleSave,
  undo,
  redo,
  saveToHistory,
  addAlert,
}: UseKeyboardShortcutsParams): void => {
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

      // Arrow keys - Move selected node
      if (selectedNode && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const moveDistance = e.shiftKey ? 10 : 1; // Shift for faster movement
        const nodeIndex = nodes.findIndex((n) => n.id === selectedNode);

        if (nodeIndex !== -1) {
          const updatedNodes = [...nodes];
          const node = { ...updatedNodes[nodeIndex] };

          switch (e.key) {
            case 'ArrowUp':
              node.position = { ...node.position, y: node.position.y - moveDistance };
              break;
            case 'ArrowDown':
              node.position = { ...node.position, y: node.position.y + moveDistance };
              break;
            case 'ArrowLeft':
              node.position = { ...node.position, x: node.position.x - moveDistance };
              break;
            case 'ArrowRight':
              node.position = { ...node.position, x: node.position.x + moveDistance };
              break;
          }

          updatedNodes[nodeIndex] = node;
          setNodes(updatedNodes);
          // Save to history on key release to avoid too many history entries
        }
        return;
      }

      // Tab - Cycle through nodes
      if (e.key === 'Tab') {
        e.preventDefault();
        if (nodes.length === 0) return;

        const currentIndex = selectedNode ? nodes.findIndex((n) => n.id === selectedNode) : -1;
        let nextIndex;

        if (e.shiftKey) {
          // Shift+Tab - Previous node
          nextIndex = currentIndex <= 0 ? nodes.length - 1 : currentIndex - 1;
        } else {
          // Tab - Next node
          nextIndex = currentIndex >= nodes.length - 1 ? 0 : currentIndex + 1;
        }

        setSelectedNode(nodes[nextIndex].id);
        setIsDrawerExpanded(true); // Open drawer to show selected node details
        return;
      }

      // Ctrl/Cmd + D - Duplicate selected node
      if (cmdOrCtrl && e.key === 'd' && selectedNode) {
        e.preventDefault();
        const nodeToDuplicate = nodes.find((n) => n.id === selectedNode);
        if (nodeToDuplicate) {
          const newNode = {
            ...nodeToDuplicate,
            id: `node-${Date.now()}-${Math.random()}`,
            position: {
              x: nodeToDuplicate.position.x + PASTE_OFFSET_X,
              y: nodeToDuplicate.position.y + PASTE_OFFSET_Y,
            },
          };
          const updatedNodes = [...nodes, newNode];
          setNodes(updatedNodes);
          saveToHistory(updatedNodes, connections);
          setSelectedNode(newNode.id);
          addAlert('Node duplicated', AlertVariant.success);
        }
        return;
      }

      // Backspace - Delete selected node (alternative to Delete key)
      if (e.key === 'Backspace' && selectedNode) {
        e.preventDefault();
        handleDeleteNode(selectedNode);
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
  }, [
    selectedNode,
    selectedNodes,
    copiedNodes,
    nodes,
    connections,
    spacePressed,
    setSpacePressed,
    setIsPanning,
    setSelectedNode,
    setSelectedNodes,
    setCopiedNodes,
    setConnecting,
    setIsDrawerExpanded,
    setNodes,
    handleDeleteNode,
    handleSave,
    undo,
    redo,
    saveToHistory,
    addAlert,
  ]);
};
