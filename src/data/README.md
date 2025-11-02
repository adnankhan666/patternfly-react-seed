# Mock Data Library

This directory contains mock data factories and pre-configured test data for the workflow application. All mocks follow patterns from the ODH Dashboard project.

## Available Mocks

### 1. Workflows (`mockWorkflow.ts`)

Factory for creating workflow instances with nodes and connections.

```typescript
import { mockWorkflow, MOCK_WORKFLOWS } from './data';

// Create custom workflow
const workflow = mockWorkflow({
  projectName: 'My ML Pipeline',
  status: WorkflowStatus.ACTIVE,
  nodes: [...],
  connections: [...],
});

// Use pre-configured workflows
const activeWorkflow = MOCK_WORKFLOWS.active;
const workflowWithNodes = MOCK_WORKFLOWS.withNodes;
```

**Pre-configured workflows:**
- `MOCK_WORKFLOWS.draft` - Workflow in draft state
- `MOCK_WORKFLOWS.active` - Active production workflow
- `MOCK_WORKFLOWS.executing` - Currently executing workflow
- `MOCK_WORKFLOWS.archived` - Archived legacy workflow
- `MOCK_WORKFLOWS.withNodes` - Complete workflow with 3 nodes and 2 connections

### 2. Workflow Executions (`mockExecution.ts`)

Factory for workflow execution runs with status tracking.

```typescript
import { mockExecution, MOCK_EXECUTIONS } from './data';

// Create custom execution
const execution = mockExecution({
  workflowName: 'ML Training Pipeline',
  status: ExecutionStatus.RUNNING,
  steps: [...],
});

// Use pre-configured executions
const completedExec = MOCK_EXECUTIONS.completed;
const runningExec = MOCK_EXECUTIONS.running;
const failedExec = MOCK_EXECUTIONS.failed;

// Generate execution history
const history = mockExecutionHistory('workflow-1', 10);
```

**Execution statuses:**
- `PENDING` - Queued for execution
- `RUNNING` - Currently executing
- `COMPLETED` - Successfully completed
- `FAILED` - Failed with errors
- `CANCELLED` - Cancelled by user

### 3. Workflow Nodes (`mockNode.ts`)

Factory for creating workflow nodes with different types.

```typescript
import { mockNode, MOCK_NODES, mockLinearWorkflowNodes } from './data';

// Create custom node
const node = mockNode({
  type: 'training',
  label: 'Model Training',
  position: { x: 100, y: 100 },
});

// Use pre-configured nodes
const notebook = MOCK_NODES.notebook;
const training = MOCK_NODES.training;

// Generate node layouts
const gridNodes = mockNodeGrid(3, 4); // 3 rows, 4 columns
const linearNodes = mockLinearWorkflowNodes(); // Sequential pipeline
```

**Available node types:**
- `notebooks` - Jupyter notebooks (green)
- `experiments` - Experiment tracking (blue)
- `training` - Model training (purple)
- `tuning` - Hyperparameter tuning (pink)
- `model-serving` - Model deployment (orange)
- `pipelines` - Data pipelines (cyan)
- `model-registry` - Model versioning (teal)
- `feast` - Feature store (red)

### 4. Projects (`mockProject.ts`)

Factory for project/workspace instances.

```typescript
import { mockProject, MOCK_PROJECTS, mockMultipleProjects } from './data';

// Create custom project
const project = mockProject({
  displayName: 'ML Research Project',
  description: 'Experimental ML workflows',
  workflowCount: 15,
});

// Use pre-configured projects
const activeProject = MOCK_PROJECTS.activeProject;
const dataProject = MOCK_PROJECTS.dataProcessing;

// Generate multiple projects
const projects = mockMultipleProjects(10);
```

### 5. Users (`mockUser.ts`)

Factory for user accounts and authentication.

```typescript
import { mockUser, MOCK_USERS, mockAuthResponse } from './data';

// Create custom user
const user = mockUser({
  username: 'johndoe',
  email: 'john@example.com',
  role: UserRole.EDITOR,
});

// Use pre-configured users
const admin = MOCK_USERS.admin;
const dataScientist = MOCK_USERS.dataScientist;

// Mock authentication
const authResponse = mockAuthResponse(user);
```

**User roles:**
- `ADMIN` - Full system access
- `EDITOR` - Create/edit workflows
- `VIEWER` - Read-only access

### 6. Registered Models (`mockRegisteredModel.ts`)

Factory for ML model registry entries.

```typescript
import { mockRegisteredModel, MOCK_REGISTERED_MODELS } from './data';

// Create custom model
const model = mockRegisteredModel({
  name: 'sentiment-classifier',
  state: ModelState.LIVE,
  customProperties: {
    framework: 'pytorch',
    accuracy: 0.95,
  },
});

// Use pre-configured models
const liveModel = MOCK_REGISTERED_MODELS.liveModel;
const archivedModel = MOCK_REGISTERED_MODELS.archivedModel;
```

## Usage in Tests

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { MOCK_WORKFLOWS } from '@/data';
import WorkflowList from './WorkflowList';

describe('WorkflowList', () => {
  it('should render workflows', () => {
    const workflows = Object.values(MOCK_WORKFLOWS);
    render(<WorkflowList workflows={workflows} />);

    expect(screen.getByText('Active Production Workflow')).toBeInTheDocument();
  });
});
```

### API Mocking (MSW)

```typescript
import { rest } from 'msw';
import { mockWorkflowsList, MOCK_WORKFLOWS } from '@/data';

export const handlers = [
  rest.get('/api/workflows', (req, res, ctx) => {
    return res(ctx.json(mockWorkflowsList()));
  }),

  rest.get('/api/workflows/:id', (req, res, ctx) => {
    const { id } = req.params;
    const workflow = MOCK_WORKFLOWS.active;
    return res(ctx.json(workflow));
  }),
];
```

### Storybook Stories

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { MOCK_EXECUTIONS } from '@/data';
import ExecutionDetails from './ExecutionDetails';

const meta: Meta<typeof ExecutionDetails> = {
  title: 'Components/ExecutionDetails',
  component: ExecutionDetails,
};

export const Running: StoryObj = {
  args: {
    execution: MOCK_EXECUTIONS.running,
  },
};

export const Failed: StoryObj = {
  args: {
    execution: MOCK_EXECUTIONS.failed,
  },
};
```

## File Structure

```
src/data/
├── index.ts                    # Central export file
├── README.md                   # This file
├── mockWorkflow.ts            # Workflow mocks
├── mockExecution.ts           # Execution mocks
├── mockNode.ts                # Node mocks
├── mockProject.ts             # Project mocks
├── mockUser.ts                # User/auth mocks
├── mockRegisteredModel.ts     # Model registry mocks
└── workflowTemplates.ts       # Workflow templates
```

## Best Practices

1. **Use Factories**: Always use factory functions to create mocks, never hardcode data
2. **Customize Minimally**: Override only the properties you need to test
3. **Type Safety**: All mocks are fully typed with TypeScript
4. **Consistency**: Follow ODH Dashboard naming conventions
5. **Documentation**: Add JSDoc comments for custom mocks

## Adding New Mocks

When creating new mock files:

1. Follow the established pattern:
   ```typescript
   type MockXType = { /* config options */ };
   export const mockX = ({ /* defaults */ }: MockXType = {}) => ({ /* return object */ });
   export const MOCK_XS = { /* pre-configured instances */ };
   ```

2. Add exports to `index.ts`
3. Document in this README
4. Include at least 3-5 pre-configured instances
5. Add utility functions for lists/arrays

## Related Documentation

- [ODH Dashboard Mocks](https://github.com/opendatahub-io/odh-dashboard/tree/main/frontend/src/__mocks__)
- [Testing Guide](../../docs/testing.md)
- [Storybook Guide](../../docs/storybook.md)
