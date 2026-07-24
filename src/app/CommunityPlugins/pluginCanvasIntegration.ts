import { Connection, NodeData } from '../Canvas/types';
import {
  Plugin,
  DEFAULT_PLUGIN_CANVAS_PROJECT,
  setPluginCanvasProjectName,
  toCanvasProjectSlug,
} from '../../data/pluginRegistry';

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 100;
const PLUGIN_NODE_SPACING = 250;
const PLUGIN_NODE_START_X = 80;
const PLUGIN_NODE_START_Y = 200;

export interface ProjectWorkflowTab {
  id: string;
  name: string;
  nodes: NodeData[];
  connections: Connection[];
  pluginId?: string;
}

export interface SavedProjectWorkflowData {
  projectName: string;
  nodes: NodeData[];
  connections: Connection[];
  projectWorkflows?: ProjectWorkflowTab[];
  activeWorkflowTab?: number;
  timestamp: string;
}

const buildPluginWorkflowTab = (plugin: Plugin): ProjectWorkflowTab => {
  const timestamp = Date.now();
  const nodes: NodeData[] = plugin.nodes.map((node, idx) => ({
    id: `node-${timestamp}-${idx}`,
    type: `plugin-${plugin.name}-${node.type}`,
    label: node.label,
    position: {
      x: PLUGIN_NODE_START_X + idx * PLUGIN_NODE_SPACING,
      y: PLUGIN_NODE_START_Y,
    },
    size: { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
    data: {
      color: node.color,
      description: node.description,
      pluginSource: plugin.name,
    },
  }));

  const connections: Connection[] = nodes.slice(0, -1).map((sourceNode, idx) => ({
    id: `conn-${timestamp}-${idx}`,
    source: sourceNode.id,
    target: nodes[idx + 1].id,
    sourceConnector: 'right',
    targetConnector: 'left',
  }));

  return {
    id: `workflow-${plugin.name}-${timestamp}`,
    name: plugin.displayName,
    nodes,
    connections,
    pluginId: plugin.name,
  };
};

export const appendPluginWorkflowToProject = (
  plugin: Plugin,
  projectDisplayName: string = DEFAULT_PLUGIN_CANVAS_PROJECT
): { slug: string; activeTabIndex: number } => {
  const displayName = projectDisplayName.trim() || DEFAULT_PLUGIN_CANVAS_PROJECT;
  setPluginCanvasProjectName(displayName);

  const slug = toCanvasProjectSlug(displayName);
  const existingProjects = JSON.parse(localStorage.getItem('canvasProjects') || '[]') as string[];

  if (!existingProjects.includes(displayName)) {
    existingProjects.push(displayName);
    localStorage.setItem('canvasProjects', JSON.stringify(existingProjects));
  }

  const storageKey = `workflow-${displayName}`;
  const savedRaw = localStorage.getItem(storageKey);
  let saved: SavedProjectWorkflowData | null = null;

  if (savedRaw) {
    try {
      saved = JSON.parse(savedRaw) as SavedProjectWorkflowData;
    } catch {
      saved = null;
    }
  }

  let projectWorkflows: ProjectWorkflowTab[] = saved?.projectWorkflows?.length
    ? saved.projectWorkflows
    : saved?.nodes?.length
      ? [{
          id: 'workflow-1',
          name: 'Main Workflow',
          nodes: saved.nodes,
          connections: saved.connections || [],
        }]
      : [{
          id: 'workflow-1',
          name: 'Main Workflow',
          nodes: [],
          connections: [],
        }];

  const existingTabIndex = projectWorkflows.findIndex((wf) => wf.pluginId === plugin.name);
  let activeTabIndex: number;

  if (existingTabIndex >= 0) {
    activeTabIndex = existingTabIndex;
  } else {
    const newTab = buildPluginWorkflowTab(plugin);
    projectWorkflows = [...projectWorkflows, newTab];
    activeTabIndex = projectWorkflows.length - 1;
  }

  const activeWorkflow = projectWorkflows[activeTabIndex];

  const workflowData: SavedProjectWorkflowData = {
    projectName: displayName,
    nodes: activeWorkflow.nodes,
    connections: activeWorkflow.connections,
    projectWorkflows,
    activeWorkflowTab: activeTabIndex,
    timestamp: new Date().toISOString(),
  };

  localStorage.setItem(storageKey, JSON.stringify(workflowData));
  window.dispatchEvent(new Event('projectsUpdated'));

  return { slug, activeTabIndex };
};
