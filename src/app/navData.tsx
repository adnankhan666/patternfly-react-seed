import * as React from 'react';

export interface NavDataHref {
  id: string;
  label: string;
  href: string;
}

export interface NavDataGroup {
  id: string;
  group: {
    id: string;
    title: string;
  };
  children: NavDataHref[];
}

export type NavDataItem = NavDataHref | NavDataGroup;

export const isNavDataGroup = (navDataItem: NavDataItem): navDataItem is NavDataGroup =>
  (navDataItem as NavDataGroup).group !== undefined;

// Navigation data based on ODH Dashboard structure
export const useNavigationData = (): NavDataItem[] => {
  const [dynamicProjects, setDynamicProjects] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Load projects from localStorage
    const loadProjects = () => {
      const projects = JSON.parse(localStorage.getItem('canvasProjects') || '[]');
      setDynamicProjects(projects);
    };

    loadProjects();

    // Listen for storage changes
    window.addEventListener('storage', loadProjects);

    // Custom event for same-window updates
    const handleProjectUpdate = () => loadProjects();
    window.addEventListener('projectsUpdated', handleProjectUpdate);

    return () => {
      window.removeEventListener('storage', loadProjects);
      window.removeEventListener('projectsUpdated', handleProjectUpdate);
    };
  }, []);

  return React.useMemo(() => {
    const navData: NavDataItem[] = [
      // Home
      {
        id: 'home',
        label: 'Home',
        href: '/',
      },
      // Applications (Expandable Group)
      {
        id: 'applications',
        group: {
          id: 'apps',
          title: 'Applications',
        },
        children: [
          {
            id: 'apps-installed',
            label: 'Enabled',
            href: '/applications/enabled',
          },
          {
            id: 'apps-explore',
            label: 'Explore',
            href: '/applications/explore',
          },
        ],
      },
      // Canvas (Expandable Group)
      {
        id: 'canvas',
        group: {
          id: 'canvas',
          title: 'Canvas',
        },
        children: [
          {
            id: 'canvas-overview',
            label: 'Overview',
            href: '/canvas',
          },
          {
            id: 'canvas-mydsproject-1',
            label: 'mydsproject-1',
            href: '/canvas/mydsproject-1',
          },
          {
            id: 'canvas-mydsproject-2',
            label: 'mydsproject-2',
            href: '/canvas/mydsproject-2',
          },
          {
            id: 'canvas-mydsproject-3',
            label: 'mydsproject-3',
            href: '/canvas/mydsproject-3',
          },
          // Add dynamic projects
          ...dynamicProjects.map((project) => ({
            id: `canvas-${project.toLowerCase().replace(/\s+/g, '-')}`,
            label: project,
            href: `/canvas/${project.toLowerCase().replace(/\s+/g, '-')}`,
          })),
        ],
      },
      // Data Science Projects
      {
        id: 'dsg',
        label: 'Data Science Projects',
        href: '/projects',
      },
      // Data Science Pipelines (Expandable Group)
      {
        id: 'pipelines',
        group: {
          id: 'pipelines',
          title: 'Data Science Pipelines',
        },
        children: [
          {
            id: 'global-pipelines',
            label: 'Pipelines',
            href: '/pipelines',
          },
          {
            id: 'global-pipeline-runs',
            label: 'Runs',
            href: '/pipelines/runs',
          },
        ],
      },
      // Experiments (Expandable Group)
      {
        id: 'experiments',
        group: {
          id: 'experiments',
          title: 'Experiments',
        },
        children: [
          {
            id: 'experiments-and-runs',
            label: 'Experiments and runs',
            href: '/experiments',
          },
          {
            id: 'artifacts',
            label: 'Artifacts',
            href: '/experiments/artifacts',
          },
        ],
      },
      // Model Catalog
      {
        id: 'modelCatalog',
        label: 'Model Catalog',
        href: '/modelCatalog',
      },
      // Notebooks
      {
        id: 'notebooks',
        label: 'Notebooks',
        href: '/notebooks',
      },
      // Training
      {
        id: 'training',
        label: 'Training',
        href: '/training',
      },
      // Telemetry
      {
        id: 'telemetry',
        label: 'Telemetry',
        href: '/telemetry',
      },
      // Settings (Expandable Group - Admin Only)
      {
        id: 'settings',
        group: {
          id: 'settings',
          title: 'Settings',
        },
        children: [
          {
            id: 'settings-notebook-images',
            label: 'Notebook images',
            href: '/settings/notebookImages',
          },
          {
            id: 'settings-cluster-settings',
            label: 'Cluster settings',
            href: '/settings/clusterSettings',
          },
          {
            id: 'settings-accelerator-profiles',
            label: 'Accelerator profiles',
            href: '/settings/acceleratorProfiles',
          },
          {
            id: 'settings-custom-serving-runtimes',
            label: 'Serving runtimes',
            href: '/settings/servingRuntimes',
          },
          {
            id: 'settings-group-settings',
            label: 'User management',
            href: '/settings/groupSettings',
          },
        ],
      },
    ];

    return navData;
  }, [dynamicProjects]);
};
