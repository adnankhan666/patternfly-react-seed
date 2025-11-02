/**
 * Mock data factory for Projects
 * Based on ODH Dashboard project mock patterns
 */

export enum ProjectPhase {
  ACTIVE = 'Active',
  TERMINATING = 'Terminating',
}

export interface Project {
  id: string;
  name: string;
  displayName: string;
  description: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  phase: ProjectPhase;
  tags?: string[];
  workflowCount?: number;
  collaborators?: string[];
}

type MockProjectType = {
  id?: string;
  name?: string;
  displayName?: string;
  description?: string;
  owner?: string;
  createdAt?: string;
  phase?: ProjectPhase;
  tags?: string[];
  workflowCount?: number;
  collaborators?: string[];
};

/**
 * Factory function to create mock Project instances for testing
 */
export const mockProject = ({
  id = 'project-1',
  name = 'test-project',
  displayName = 'Test Project',
  description = 'A test project for ML workflows',
  owner = 'test-user',
  createdAt = '2024-10-01T10:00:00Z',
  phase = ProjectPhase.ACTIVE,
  tags = ['ml', 'data-science'],
  workflowCount = 5,
  collaborators = ['test-user', 'collaborator-1'],
}: MockProjectType = {}): Project => ({
  id,
  name,
  displayName,
  description,
  owner,
  createdAt,
  updatedAt: new Date().toISOString(),
  phase,
  tags,
  workflowCount,
  collaborators,
});

/**
 * Collection of pre-configured mock projects
 */
export const MOCK_PROJECTS = {
  activeProject: mockProject({
    id: 'project-active',
    name: 'ml-training-project',
    displayName: 'ML Training Project',
    description: 'Production ML model training workflows',
    phase: ProjectPhase.ACTIVE,
    workflowCount: 12,
    tags: ['ml', 'production', 'training'],
  }),

  dataProcessing: mockProject({
    id: 'project-data',
    name: 'data-processing',
    displayName: 'Data Processing Pipelines',
    description: 'ETL and data transformation workflows',
    workflowCount: 8,
    tags: ['data', 'etl', 'processing'],
  }),

  modelServing: mockProject({
    id: 'project-serving',
    name: 'model-serving',
    displayName: 'Model Deployment',
    description: 'Model serving and deployment workflows',
    workflowCount: 6,
    tags: ['serving', 'deployment', 'production'],
  }),

  experimental: mockProject({
    id: 'project-experimental',
    name: 'experimental-workflows',
    displayName: 'Experimental Workflows',
    description: 'Testing and experimental workflow development',
    workflowCount: 3,
    tags: ['experimental', 'testing'],
    collaborators: ['test-user', 'researcher-1', 'researcher-2'],
  }),

  terminating: mockProject({
    id: 'project-terminating',
    name: 'old-project',
    displayName: 'Old Project (Deleting)',
    description: 'Legacy project being deleted',
    phase: ProjectPhase.TERMINATING,
    workflowCount: 0,
    tags: ['deprecated'],
  }),
};

/**
 * Mock projects list response
 */
export const mockProjectsList = (
  projects: Project[] = Object.values(MOCK_PROJECTS),
  includeTerminating: boolean = false,
) => {
  const filteredProjects = includeTerminating
    ? projects
    : projects.filter(p => p.phase === ProjectPhase.ACTIVE);

  return {
    items: filteredProjects,
    total: filteredProjects.length,
    page: 1,
    pageSize: 10,
  };
};

/**
 * Create multiple mock projects
 */
export const mockMultipleProjects = (count: number = 5): Project[] => {
  const projects: Project[] = [];

  for (let i = 1; i <= count; i++) {
    projects.push(mockProject({
      id: `project-${i}`,
      name: `project-${i}`,
      displayName: `Project ${i}`,
      description: `Description for project ${i}`,
      workflowCount: Math.floor(Math.random() * 20),
      tags: [`tag-${i}`, 'ml'],
    }));
  }

  return projects;
};
