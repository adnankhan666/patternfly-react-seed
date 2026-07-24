import * as React from 'react';
import { getDeployedPlugins, PLUGIN_STATE_EVENT } from '../data/pluginRegistry';
import { getDeployedFeatures, FEATURE_EXPERIENCED_EVENT } from '../data/featureExperienceStore';
import { getEarlyAccessFeatureById } from '../data/previewFeatures';
import { isCommunityPluginsEnabled, COMMUNITY_PLUGINS_TOGGLED_EVENT } from './Settings/ClusterSettings';

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
  children: NavDataItem[];
}

export type NavDataItem = NavDataHref | NavDataGroup;

export const isNavDataGroup = (navDataItem: NavDataItem): navDataItem is NavDataGroup =>
  (navDataItem as NavDataGroup).group !== undefined;

/** Demo surprise: Early Access is hidden until unlocked via Dashboard Easter egg */
export const EARLY_ACCESS_UNLOCKED_KEY = 'earlyAccessUnlocked';
export const EARLY_ACCESS_UNLOCKED_EVENT = 'earlyAccessUnlocked';

export function isEarlyAccessUnlocked(): boolean {
  try {
    return localStorage.getItem(EARLY_ACCESS_UNLOCKED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function unlockEarlyAccess(): void {
  localStorage.setItem(EARLY_ACCESS_UNLOCKED_KEY, 'true');
  window.dispatchEvent(new CustomEvent(EARLY_ACCESS_UNLOCKED_EVENT));
}

export function lockEarlyAccess(): void {
  localStorage.removeItem(EARLY_ACCESS_UNLOCKED_KEY);
  window.dispatchEvent(new CustomEvent(EARLY_ACCESS_UNLOCKED_EVENT));
}

// Navigation data based on ODH Dashboard structure
export const useNavigationData = (): NavDataItem[] => {
  const [dynamicProjects, setDynamicProjects] = React.useState<string[]>([]);
  const [deployedPluginsVersion, setDeployedPluginsVersion] = React.useState(0);
  const [earlyAccessVersion, setEarlyAccessVersion] = React.useState(0);
  const [communityPluginsVersion, setCommunityPluginsVersion] = React.useState(0);

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

  React.useEffect(() => {
    const refreshDeployedPlugins = () => setDeployedPluginsVersion((v) => v + 1);

    window.addEventListener('storage', refreshDeployedPlugins);
    window.addEventListener(PLUGIN_STATE_EVENT, refreshDeployedPlugins);

    return () => {
      window.removeEventListener('storage', refreshDeployedPlugins);
      window.removeEventListener(PLUGIN_STATE_EVENT, refreshDeployedPlugins);
    };
  }, []);

  React.useEffect(() => {
    const refreshEarlyAccess = () => setEarlyAccessVersion((v) => v + 1);
    window.addEventListener(EARLY_ACCESS_UNLOCKED_EVENT, refreshEarlyAccess);
    window.addEventListener(FEATURE_EXPERIENCED_EVENT, refreshEarlyAccess);
    window.addEventListener('storage', refreshEarlyAccess);
    return () => {
      window.removeEventListener(EARLY_ACCESS_UNLOCKED_EVENT, refreshEarlyAccess);
      window.removeEventListener(FEATURE_EXPERIENCED_EVENT, refreshEarlyAccess);
      window.removeEventListener('storage', refreshEarlyAccess);
    };
  }, []);

  React.useEffect(() => {
    const refreshCommunity = () => setCommunityPluginsVersion((v) => v + 1);
    window.addEventListener(COMMUNITY_PLUGINS_TOGGLED_EVENT, refreshCommunity);
    return () => window.removeEventListener(COMMUNITY_PLUGINS_TOGGLED_EVENT, refreshCommunity);
  }, []);

  return React.useMemo(() => {
    void deployedPluginsVersion;
    void earlyAccessVersion;
    void communityPluginsVersion;
    const deployedPlugins = getDeployedPlugins();
    const earlyAccessUnlocked = isEarlyAccessUnlocked();
    const communityPluginsEnabled = isCommunityPluginsEnabled();

    const deployedFeatures = getDeployedFeatures().filter((d) => d.status !== 'stopped');

    const earlyAccessGroup: NavDataItem = {
      id: 'earlyAccess',
      group: {
        id: 'earlyAccess',
        title: 'Early Access',
      },
      children: [
        {
          id: 'early-access-overview',
          label: 'Overview',
          href: '/early-access',
        },
        ...(deployedFeatures.length > 0
          ? [
              {
                id: 'early-access-deployed-group',
                group: {
                  id: 'early-access-deployed-group',
                  title: 'Deployed',
                },
                children: [
                  {
                    id: 'early-access-deployed',
                    label: 'All Deployed',
                    href: '/early-access/deployed',
                  },
                  ...deployedFeatures.map((d) => {
                    const feature = getEarlyAccessFeatureById(d.featureId);
                    return {
                      id: `ea-deployed-${d.featureId}`,
                      label: feature?.name ?? d.featureId,
                      href: `/early-access/deployed/${d.featureId}`,
                    };
                  }),
                ],
              } as NavDataItem,
            ]
          : [
              {
                id: 'early-access-deployed',
                label: 'Deployed',
                href: '/early-access/deployed',
              },
            ]),
      ],
    };

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
      // Early Access — hidden until unlocked (demo Easter egg)
      ...(earlyAccessUnlocked ? [earlyAccessGroup] : []),
      // Community Plugins -- gated by admin settings (OdhDashboardConfig)
      ...(communityPluginsEnabled ? [{
        id: 'communityPlugins',
        group: {
          id: 'communityPlugins',
          title: 'Community Plugins',
        },
        children: [
          {
            id: 'plugins-overview',
            label: 'Overview',
            href: '/plugins',
          },
          {
            id: 'plugins-quickstarts',
            label: 'Quickstarts',
            href: '/plugins/quickstarts',
          },
          ...(deployedPlugins.length > 0
            ? [
                {
                  id: 'plugins-deployed-group',
                  group: {
                    id: 'plugins-deployed-group',
                    title: 'Deployed',
                  },
                  children: [
                    {
                      id: 'plugins-deployed',
                      label: 'All Deployed',
                      href: '/plugins/deployed',
                    },
                    ...deployedPlugins.map((plugin) => ({
                      id: `plugin-${plugin.name}`,
                      label: plugin.displayName,
                      href: `/plugins/${plugin.name}/workspace`,
                    })),
                  ],
                } as NavDataItem,
              ]
            : [
                {
                  id: 'plugins-deployed',
                  label: 'Deployed',
                  href: '/plugins/deployed',
                },
              ]),
        ],
      } as NavDataItem] : []),
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
  }, [dynamicProjects, deployedPluginsVersion, earlyAccessVersion, communityPluginsVersion]);
};
