import * as React from 'react';
import { PageSection } from '@patternfly/react-core';
import { WorkflowCanvas } from './WorkflowCanvas';

const MyDSProject2: React.FunctionComponent = () => (
  <PageSection padding={{ default: 'noPadding' }}>
    <WorkflowCanvas projectName="mydsproject-2" />
  </PageSection>
);

export { MyDSProject2 };
