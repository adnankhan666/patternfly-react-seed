import * as React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Dashboard } from '@app/Dashboard/Dashboard';
import { EnabledApplications } from '@app/Applications/EnabledApplications';
import { ExploreApplications } from '@app/Applications/ExploreApplications';
import { Canvas } from '@app/Canvas/Canvas';
import { MyDSProject1 } from '@app/Canvas/MyDSProject1';
import { MyDSProject2 } from '@app/Canvas/MyDSProject2';
import { MyDSProject3 } from '@app/Canvas/MyDSProject3';
import { DynamicProject } from '@app/Canvas/DynamicProject';
import { Projects } from '@app/Projects/Projects';
import { Pipelines } from '@app/Pipelines/Pipelines';
import { PipelineRuns } from '@app/Pipelines/PipelineRuns';
import { Experiments } from '@app/Experiments/Experiments';
import { Artifacts } from '@app/Experiments/Artifacts';
import { DistributedWorkloads } from '@app/DistributedWorkloads/DistributedWorkloads';
import { Extensions } from '@app/Extensions/Extensions';
import { Feast } from '@app/Feast/Feast';
import { HardwareProfiles } from '@app/HardwareProfiles/HardwareProfiles';
import { MCPServers } from '@app/MCPServers/MCPServers';
import { ModelCatalog } from '@app/ModelCatalog/ModelCatalog';
import { ModelRegistry } from '@app/ModelRegistry/ModelRegistry';
import { ModelServing } from '@app/ModelServing/ModelServing';
import { Notebooks } from '@app/Notebooks/Notebooks';
import { Resources } from '@app/Resources/Resources';
import { Training } from '@app/Training/Training';
import { Tuning } from '@app/Tuning/Tuning';
import { NotebookImages } from '@app/Settings/NotebookImages';
import { ClusterSettings } from '@app/Settings/ClusterSettings';
import { AcceleratorProfiles } from '@app/Settings/AcceleratorProfiles';
import { ServingRuntimes } from '@app/Settings/ServingRuntimes';
import { UserManagement } from '@app/Settings/UserManagement';
import { NotFound } from '@app/NotFound/NotFound';

export interface IAppRoute {
  label?: string; // Excluding the label will exclude the route from the nav sidebar in AppLayout
  /* eslint-disable @typescript-eslint/no-explicit-any */
  element: React.ReactElement;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  exact?: boolean;
  path: string;
  title: string;
  routes?: undefined;
}

export interface IAppRouteGroup {
  label: string;
  routes: IAppRoute[];
}

export type AppRouteConfig = IAppRoute | IAppRouteGroup;

const routes: AppRouteConfig[] = [
  {
    element: <Dashboard />,
    exact: true,
    path: '/',
    title: 'ODH Dashboard | Home',
  },
  {
    element: <EnabledApplications />,
    exact: true,
    path: '/applications/enabled',
    title: 'ODH Dashboard | Enabled Applications',
  },
  {
    element: <ExploreApplications />,
    exact: true,
    path: '/applications/explore',
    title: 'ODH Dashboard | Explore Applications',
  },
  {
    element: <Canvas />,
    exact: true,
    path: '/canvas',
    title: 'ODH Dashboard | Canvas',
  },
  {
    element: <MyDSProject1 />,
    exact: true,
    path: '/canvas/mydsproject-1',
    title: 'ODH Dashboard | mydsproject-1',
  },
  {
    element: <MyDSProject2 />,
    exact: true,
    path: '/canvas/mydsproject-2',
    title: 'ODH Dashboard | mydsproject-2',
  },
  {
    element: <MyDSProject3 />,
    exact: true,
    path: '/canvas/mydsproject-3',
    title: 'ODH Dashboard | mydsproject-3',
  },
  {
    element: <DynamicProject />,
    exact: true,
    path: '/canvas/:projectName',
    title: 'ODH Dashboard | Project',
  },
  {
    element: <Projects />,
    exact: true,
    path: '/projects',
    title: 'ODH Dashboard | Data Science Projects',
  },
  {
    element: <Pipelines />,
    exact: true,
    path: '/pipelines',
    title: 'ODH Dashboard | Pipelines',
  },
  {
    element: <PipelineRuns />,
    exact: true,
    path: '/pipelines/runs',
    title: 'ODH Dashboard | Pipeline Runs',
  },
  {
    element: <Experiments />,
    exact: true,
    path: '/experiments',
    title: 'ODH Dashboard | Experiments',
  },
  {
    element: <Artifacts />,
    exact: true,
    path: '/experiments/artifacts',
    title: 'ODH Dashboard | Artifacts',
  },
  {
    element: <DistributedWorkloads />,
    exact: true,
    path: '/distributedWorkloads',
    title: 'ODH Dashboard | Distributed Workload Metrics',
  },
  {
    element: <Extensions />,
    exact: true,
    path: '/extensions',
    title: 'ODH Dashboard | Extensions',
  },
  {
    element: <Feast />,
    exact: true,
    path: '/feast',
    title: 'ODH Dashboard | Feast',
  },
  {
    element: <HardwareProfiles />,
    exact: true,
    path: '/hardwareProfiles',
    title: 'ODH Dashboard | Hardware Profiles',
  },
  {
    element: <MCPServers />,
    exact: true,
    path: '/mcpServers',
    title: 'ODH Dashboard | MCP Servers',
  },
  {
    element: <ModelCatalog />,
    exact: true,
    path: '/modelCatalog',
    title: 'ODH Dashboard | Model Catalog',
  },
  {
    element: <ModelRegistry />,
    exact: true,
    path: '/modelRegistry',
    title: 'ODH Dashboard | Model Registry',
  },
  {
    element: <ModelServing />,
    exact: true,
    path: '/modelServing',
    title: 'ODH Dashboard | Model Serving',
  },
  {
    element: <Notebooks />,
    exact: true,
    path: '/notebooks',
    title: 'ODH Dashboard | Notebooks',
  },
  {
    element: <Resources />,
    exact: true,
    path: '/resources',
    title: 'ODH Dashboard | Resources',
  },
  {
    element: <Training />,
    exact: true,
    path: '/training',
    title: 'ODH Dashboard | Training',
  },
  {
    element: <Tuning />,
    exact: true,
    path: '/tuning',
    title: 'ODH Dashboard | Tuning',
  },
  {
    element: <NotebookImages />,
    exact: true,
    path: '/settings/notebookImages',
    title: 'ODH Dashboard | Notebook Images',
  },
  {
    element: <ClusterSettings />,
    exact: true,
    path: '/settings/clusterSettings',
    title: 'ODH Dashboard | Cluster Settings',
  },
  {
    element: <AcceleratorProfiles />,
    exact: true,
    path: '/settings/acceleratorProfiles',
    title: 'ODH Dashboard | Accelerator Profiles',
  },
  {
    element: <ServingRuntimes />,
    exact: true,
    path: '/settings/servingRuntimes',
    title: 'ODH Dashboard | Serving Runtimes',
  },
  {
    element: <UserManagement />,
    exact: true,
    path: '/settings/groupSettings',
    title: 'ODH Dashboard | User Management',
  },
];

const flattenedRoutes: IAppRoute[] = routes.reduce(
  (flattened, route) => [...flattened, ...(route.routes ? route.routes : [route])],
  [] as IAppRoute[],
);

const AppRoutes = (): React.ReactElement => (
  <Routes>
    {flattenedRoutes.map(({ path, element }, idx) => (
      <Route path={path} element={element} key={idx} />
    ))}
    <Route element={<NotFound />} />
  </Routes>
);

export { AppRoutes, routes };
