import * as React from 'react';
import { PageSection } from '@patternfly/react-core';
import { WorkflowCanvas } from './WorkflowCanvas';
import { useSidebar } from '../contexts/SidebarContext';

const MyDSProject1: React.FunctionComponent = () => {
  const { setSidebarOpen } = useSidebar();

  // Auto-hide sidebar when project is selected
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  return (
    <PageSection padding={{ default: 'noPadding' }}>
      <WorkflowCanvas projectName="mydsproject-1" />
    </PageSection>
  );
};

export { MyDSProject1 };
