import * as React from 'react';
import { PageSection } from '@patternfly/react-core';
import { WorkflowCanvas } from './WorkflowCanvas';

const MyDSProject3: React.FunctionComponent = () => (
  <PageSection padding={{ default: 'noPadding' }}>
    <WorkflowCanvas projectName="mydsproject-3" />
  </PageSection>
);

export { MyDSProject3 };
