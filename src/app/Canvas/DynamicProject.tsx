import * as React from 'react';
import { useParams } from 'react-router-dom';
import { PageSection } from '@patternfly/react-core';
import { WorkflowCanvas } from './WorkflowCanvas';
import { useSidebar } from '../contexts/SidebarContext';

const DynamicProject: React.FunctionComponent = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const { setSidebarOpen } = useSidebar();

  // Auto-hide sidebar when project is selected
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  // Convert URL-friendly name back to display name
  const displayName = projectName
    ? projectName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Project';

  return (
    <PageSection padding={{ default: 'noPadding' }}>
      <WorkflowCanvas projectName={displayName} />
    </PageSection>
  );
};

export { DynamicProject };
