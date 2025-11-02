import * as React from 'react';
import { PageSection } from '@patternfly/react-core';
import { WorkflowCanvas } from './WorkflowCanvas';
import { useSidebar } from '../contexts/SidebarContext';

const MyDSProject2: React.FunctionComponent = () => {
  const { setSidebarOpen } = useSidebar();

  // Auto-hide sidebar when project is selected
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  return (
    <PageSection padding={{ default: 'noPadding' }}>
      <WorkflowCanvas projectName="mydsproject-2" />
    </PageSection>
  );
};

export { MyDSProject2 };
