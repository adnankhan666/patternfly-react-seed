import { z } from 'zod';

/**
 * Zod schemas for workflow data validation
 * Ensures type safety and runtime validation for workflow operations
 */

// Connector position schema
export const ConnectorPositionSchema = z.enum(['top', 'right', 'bottom', 'left']);

// Node size schema
export const NodeSizeSchema = z.object({
  width: z.number().min(100).max(1000),
  height: z.number().min(60).max(800),
});

// Node data schema
export const NodeDataSchemaData = z.object({
  color: z.string().optional(),
  description: z.string().optional(),
});

// Position schema
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// NodeData schema - represents a workflow node
export const NodeDataSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  position: PositionSchema,
  size: NodeSizeSchema.optional(),
  data: NodeDataSchemaData.optional(),
});

// Connection schema - represents a connection between two nodes
export const ConnectionSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceConnector: ConnectorPositionSchema.optional(),
  targetConnector: ConnectorPositionSchema.optional(),
});

// Workflow state schema - complete workflow data structure
export const WorkflowStateSchema = z.object({
  nodes: z.array(NodeDataSchema),
  connections: z.array(ConnectionSchema),
});

// Workflow file schema - for import/export operations
export const WorkflowFileSchema = z.object({
  projectName: z.string(),
  nodes: z.array(NodeDataSchema),
  connections: z.array(ConnectionSchema),
  timestamp: z.string().datetime(),
  version: z.string().optional().default('1.0'),
});

// WorkflowNode type schema - for node types in palette
export const WorkflowNodeTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  color: z.string(),
  icon: z.string().optional(),
});

// Type exports for TypeScript
export type NodeDataType = z.infer<typeof NodeDataSchema>;
export type ConnectionType = z.infer<typeof ConnectionSchema>;
export type WorkflowStateType = z.infer<typeof WorkflowStateSchema>;
export type WorkflowFileType = z.infer<typeof WorkflowFileSchema>;
export type WorkflowNodeType = z.infer<typeof WorkflowNodeTypeSchema>;
export type ConnectorPositionType = z.infer<typeof ConnectorPositionSchema>;

/**
 * Validation helper functions
 */

// Validate node data
export const validateNodeData = (data: unknown) => {
  return NodeDataSchema.safeParse(data);
};

// Validate connection data
export const validateConnection = (data: unknown) => {
  return ConnectionSchema.safeParse(data);
};

// Validate workflow state
export const validateWorkflowState = (data: unknown) => {
  return WorkflowStateSchema.safeParse(data);
};

// Validate workflow file (for import/export)
export const validateWorkflowFile = (data: unknown) => {
  return WorkflowFileSchema.safeParse(data);
};

// Strict validation (throws on error)
export const strictValidateWorkflowFile = (data: unknown): WorkflowFileType => {
  return WorkflowFileSchema.parse(data);
};

export const strictValidateWorkflowState = (data: unknown): WorkflowStateType => {
  return WorkflowStateSchema.parse(data);
};
