/**
 * Mock data factory for Workflow Nodes
 * Provides pre-configured node templates and factories
 */

import { NodeData } from '../app/Canvas/types';
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '../app/Canvas/constants';

/**
 * Node type configurations with metadata
 */
export const NODE_CONFIGS = {
  notebooks: {
    color: '#10b981',
    defaultLabel: 'Jupyter Notebook',
    description: 'Interactive development environment',
  },
  experiments: {
    color: '#3b82f6',
    defaultLabel: 'Experiment Tracking',
    description: 'Track ML experiments and metrics',
  },
  training: {
    color: '#8b5cf6',
    defaultLabel: 'Model Training',
    description: 'Train machine learning models',
  },
  tuning: {
    color: '#ec4899',
    defaultLabel: 'Hyperparameter Tuning',
    description: 'Optimize model hyperparameters',
  },
  'model-serving': {
    color: '#f59e0b',
    defaultLabel: 'Model Serving',
    description: 'Deploy models for inference',
  },
  pipelines: {
    color: '#06b6d4',
    defaultLabel: 'Pipeline',
    description: 'Data processing pipeline',
  },
  'model-registry': {
    color: '#14b8a6',
    defaultLabel: 'Model Registry',
    description: 'Register and version models',
  },
  feast: {
    color: '#f43f5e',
    defaultLabel: 'Feature Store',
    description: 'Manage ML features',
  },
};

type MockNodeType = {
  id?: string;
  type?: keyof typeof NODE_CONFIGS;
  label?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  description?: string;
};

/**
 * Factory function to create mock NodeData instances
 */
export const mockNode = ({
  id = `node-${Date.now()}`,
  type = 'notebooks',
  label,
  position = { x: 100, y: 100 },
  size = { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
  description,
}: MockNodeType = {}): NodeData => {
  const config = NODE_CONFIGS[type];

  return {
    id,
    type,
    label: label || config.defaultLabel,
    position,
    size,
    data: {
      color: config.color,
      description: description || config.description,
    },
  };
};

/**
 * Pre-configured mock nodes for common scenarios
 */
export const MOCK_NODES = {
  notebook: mockNode({
    id: 'node-notebook-1',
    type: 'notebooks',
    label: 'Data Analysis Notebook',
    position: { x: 100, y: 100 },
    description: 'Explore and analyze dataset',
  }),

  training: mockNode({
    id: 'node-training-1',
    type: 'training',
    label: 'Model Training',
    position: { x: 400, y: 100 },
    description: 'Train neural network model',
  }),

  tuning: mockNode({
    id: 'node-tuning-1',
    type: 'tuning',
    label: 'Hyperparameter Optimization',
    position: { x: 700, y: 100 },
    description: 'Optimize learning rate and batch size',
  }),

  serving: mockNode({
    id: 'node-serving-1',
    type: 'model-serving',
    label: 'Production Serving',
    position: { x: 1000, y: 100 },
    description: 'Deploy model to production endpoint',
  }),

  pipeline: mockNode({
    id: 'node-pipeline-1',
    type: 'pipelines',
    label: 'ETL Pipeline',
    position: { x: 100, y: 300 },
    description: 'Extract, transform, load data',
  }),

  registry: mockNode({
    id: 'node-registry-1',
    type: 'model-registry',
    label: 'Model Registry',
    position: { x: 400, y: 300 },
    description: 'Register trained model version',
  }),

  experiment: mockNode({
    id: 'node-experiment-1',
    type: 'experiments',
    label: 'Experiment Tracker',
    position: { x: 700, y: 300 },
    description: 'Log metrics and parameters',
  }),

  featureStore: mockNode({
    id: 'node-feast-1',
    type: 'feast',
    label: 'Feature Store',
    position: { x: 1000, y: 300 },
    description: 'Store and retrieve ML features',
  }),
};

/**
 * Create a grid of nodes for testing layouts
 */
export const mockNodeGrid = (rows: number = 3, cols: number = 3): NodeData[] => {
  const nodes: NodeData[] = [];
  const nodeTypes = Object.keys(NODE_CONFIGS) as Array<keyof typeof NODE_CONFIGS>;
  const spacingX = 300;
  const spacingY = 200;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const typeIndex = (row * cols + col) % nodeTypes.length;
      const type = nodeTypes[typeIndex];

      nodes.push(mockNode({
        id: `node-${row}-${col}`,
        type,
        position: {
          x: 100 + col * spacingX,
          y: 100 + row * spacingY,
        },
      }));
    }
  }

  return nodes;
};

/**
 * Create a linear workflow of nodes
 */
export const mockLinearWorkflowNodes = (): NodeData[] => {
  const types: Array<keyof typeof NODE_CONFIGS> = [
    'notebooks',
    'experiments',
    'training',
    'tuning',
    'model-registry',
    'model-serving',
  ];

  return types.map((type, index) => mockNode({
    id: `node-${index}`,
    type,
    position: { x: 100 + index * 250, y: 100 },
  }));
};
