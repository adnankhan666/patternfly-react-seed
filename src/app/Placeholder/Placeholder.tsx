import * as React from 'react';
import { PageSection, Title, EmptyState, EmptyStateBody } from '@patternfly/react-core';

interface PlaceholderProps {
  title: string;
  description?: string;
}

const Placeholder: React.FunctionComponent<PlaceholderProps> = ({ title, description }) => (
  <PageSection>
    <EmptyState>
      <Title headingLevel="h1" size="lg">
        {title}
      </Title>
      {description && <EmptyStateBody>{description}</EmptyStateBody>}
    </EmptyState>
  </PageSection>
);

export { Placeholder };
