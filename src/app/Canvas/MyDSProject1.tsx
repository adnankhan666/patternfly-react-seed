import * as React from 'react';
import { PageSection } from '@patternfly/react-core';
import { WorkflowCanvas } from './WorkflowCanvas';

const MyDSProject1: React.FunctionComponent = () => (
  <PageSection padding={{ default: 'noPadding' }}>
    <WorkflowCanvas projectName="mydsproject-1" />
  </PageSection>
);

export { MyDSProject1 };
