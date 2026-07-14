import * as React from 'react';
import { useParams } from 'react-router-dom';
import { PageSection } from '@patternfly/react-core';
import { WorkflowCanvas } from './WorkflowCanvas';
import { useSidebar } from '../contexts/SidebarContext';
import { toCanvasProjectSlug } from '../../data/pluginRegistry';

const titleCaseSlug = (slug: string): string =>
  slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const resolveProjectDisplayName = (slug: string): string => {
  try {
    const projects: string[] = JSON.parse(localStorage.getItem('canvasProjects') || '[]');
    const normalizedSlug = slug.toLowerCase();
    const match = projects.find((project) => toCanvasProjectSlug(project) === normalizedSlug);
    if (match) return match;
  } catch {
    // fall through to title-case fallback
  }
  return titleCaseSlug(slug);
};

const DynamicProject: React.FunctionComponent = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const { setSidebarOpen } = useSidebar();

  // Auto-hide sidebar when project is selected
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  const slug = projectName ? decodeURIComponent(projectName) : '';
  const displayName = slug ? resolveProjectDisplayName(slug) : 'Project';

  return (
    <PageSection
      padding={{ default: 'noPadding' }}
      isFilled
      style={{
        height: 'calc(100vh - 76px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <WorkflowCanvas projectName={displayName} />
    </PageSection>
  );
};

export { DynamicProject };
