import * as React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@app/ErrorBoundary';
import { Spinner } from '@patternfly/react-core';

// Loading component
const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spinner size="xl" aria-label="Loading page content" />
  </div>
);

// Lazy load all route components
const Dashboard = React.lazy(() => import('@app/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const EnabledApplications = React.lazy(() => import('@app/Applications/EnabledApplications').then(m => ({ default: m.EnabledApplications })));
const ExploreApplications = React.lazy(() => import('@app/Applications/ExploreApplications').then(m => ({ default: m.ExploreApplications })));
const Canvas = React.lazy(() => import('@app/Canvas/Canvas').then(m => ({ default: m.Canvas })));
const MyDSProject1 = React.lazy(() => import('@app/Canvas/MyDSProject1').then(m => ({ default: m.MyDSProject1 })));
const MyDSProject2 = React.lazy(() => import('@app/Canvas/MyDSProject2').then(m => ({ default: m.MyDSProject2 })));
const MyDSProject3 = React.lazy(() => import('@app/Canvas/MyDSProject3').then(m => ({ default: m.MyDSProject3 })));
const DynamicProject = React.lazy(() => import('@app/Canvas/DynamicProject').then(m => ({ default: m.DynamicProject })));
const Projects = React.lazy(() => import('@app/Projects/Projects').then(m => ({ default: m.Projects })));
const Pipelines = React.lazy(() => import('@app/Pipelines/Pipelines').then(m => ({ default: m.Pipelines })));
const PipelineRuns = React.lazy(() => import('@app/Pipelines/PipelineRuns').then(m => ({ default: m.PipelineRuns })));
const Experiments = React.lazy(() => import('@app/Experiments/Experiments').then(m => ({ default: m.Experiments })));
const Artifacts = React.lazy(() => import('@app/Experiments/Artifacts').then(m => ({ default: m.Artifacts })));
const DistributedWorkloads = React.lazy(() => import('@app/DistributedWorkloads/DistributedWorkloads').then(m => ({ default: m.DistributedWorkloads })));
const Extensions = React.lazy(() => import('@app/Extensions/Extensions').then(m => ({ default: m.Extensions })));
const Feast = React.lazy(() => import('@app/Feast/Feast').then(m => ({ default: m.Feast })));
const HardwareProfiles = React.lazy(() => import('@app/HardwareProfiles/HardwareProfiles').then(m => ({ default: m.HardwareProfiles })));
const MCPServers = React.lazy(() => import('@app/MCPServers/MCPServers').then(m => ({ default: m.MCPServers })));
const ModelCatalog = React.lazy(() => import('@app/ModelCatalog/ModelCatalog').then(m => ({ default: m.ModelCatalog })));
const ModelRegistry = React.lazy(() => import('@app/ModelRegistry/ModelRegistry').then(m => ({ default: m.ModelRegistry })));
const ModelServing = React.lazy(() => import('@app/ModelServing/ModelServing').then(m => ({ default: m.ModelServing })));
const Notebooks = React.lazy(() => import('@app/Notebooks/Notebooks').then(m => ({ default: m.Notebooks })));
const Resources = React.lazy(() => import('@app/Resources/Resources').then(m => ({ default: m.Resources })));
const Training = React.lazy(() => import('@app/Training/Training').then(m => ({ default: m.Training })));
const Tuning = React.lazy(() => import('@app/Tuning/Tuning').then(m => ({ default: m.Tuning })));
const Telemetry = React.lazy(() => import('@app/Telemetry/Telemetry').then(m => ({ default: m.Telemetry })));
const NotebookImages = React.lazy(() => import('@app/Settings/NotebookImages').then(m => ({ default: m.NotebookImages })));
const ClusterSettings = React.lazy(() => import('@app/Settings/ClusterSettings').then(m => ({ default: m.ClusterSettings })));
const AcceleratorProfiles = React.lazy(() => import('@app/Settings/AcceleratorProfiles').then(m => ({ default: m.AcceleratorProfiles })));
const ServingRuntimes = React.lazy(() => import('@app/Settings/ServingRuntimes').then(m => ({ default: m.ServingRuntimes })));
const UserManagement = React.lazy(() => import('@app/Settings/UserManagement').then(m => ({ default: m.UserManagement })));
const NotFound = React.lazy(() => import('@app/NotFound/NotFound').then(m => ({ default: m.NotFound })));

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
    element: <Telemetry />,
    exact: true,
    path: '/telemetry',
    title: 'ODH Dashboard | Telemetry',
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
  <ErrorBoundary>
    <React.Suspense fallback={<Loading />}>
      <Routes>
        {flattenedRoutes.map(({ path, element }, idx) => (
          <Route
            path={path}
            element={
              <ErrorBoundary>
                <React.Suspense fallback={<Loading />}>{element}</React.Suspense>
              </ErrorBoundary>
            }
            key={idx}
          />
        ))}
        <Route element={<NotFound />} />
      </Routes>
    </React.Suspense>
  </ErrorBoundary>
);

export { AppRoutes, routes };
