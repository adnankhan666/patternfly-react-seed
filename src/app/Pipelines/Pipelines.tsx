import * as React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Gallery,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Label,
  Flex,
  FlexItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  LabelGroup,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, CubeIcon } from '@patternfly/react-icons';
import { usePipelines } from '../services/apiService';

const Pipelines: React.FunctionComponent = () => {
  const { pipelines, loading, error } = usePipelines();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'DRAFT':
        return 'grey';
      case 'ARCHIVED':
        return 'orange';
      default:
        return 'grey';
    }
  };

  if (loading) {
    return (
      <PageSection>
        <EmptyState>
          <Spinner size="xl" />
          <Title headingLevel="h1" size="lg">
            Loading pipelines...
          </Title>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <EmptyState>
          <ExclamationCircleIcon color="var(--pf-v6-global--danger-color--100)" size="xl" />
          <Title headingLevel="h1" size="lg">
            Error loading pipelines
          </Title>
          <EmptyStateBody>{error}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (pipelines.length === 0) {
    return (
      <PageSection>
        <EmptyState>
          <CubeIcon size="xl" />
          <Title headingLevel="h1" size="lg">
            No pipelines found
          </Title>
          <EmptyStateBody>
            No data pipelines have been created yet.
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Title headingLevel="h1" size="2xl" style={{ marginBottom: '20px' }}>
        Data Pipelines
      </Title>
      <p style={{ marginBottom: '20px' }}>
        Build and manage automated data processing workflows
      </p>
      <Gallery hasGutter minWidths={{ default: '100%', md: '350px', lg: '350px', xl: '350px' }}>
        {pipelines.map((pipeline) => (
          <Card key={pipeline.pipelineId} isCompact>
            <CardBody>
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                  <FlexItem>
                    <Title headingLevel="h2" size="lg">
                      {pipeline.name}
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <Label color={getStatusColor(pipeline.status)}>{pipeline.status}</Label>
                  </FlexItem>
                </Flex>

                {pipeline.description && (
                  <FlexItem>
                    <p>{pipeline.description}</p>
                  </FlexItem>
                )}

                <FlexItem>
                  <DescriptionList isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Owner</DescriptionListTerm>
                      <DescriptionListDescription>{pipeline.owner}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Version</DescriptionListTerm>
                      <DescriptionListDescription>v{pipeline.version}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Runs</DescriptionListTerm>
                      <DescriptionListDescription>
                        {pipeline.runsCount} ({pipeline.successRate}% success)
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Steps</DescriptionListTerm>
                      <DescriptionListDescription>{pipeline.steps.length}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </FlexItem>

                {pipeline.tags && pipeline.tags.length > 0 && (
                  <FlexItem>
                    <LabelGroup>
                      {pipeline.tags.map((tag, index) => (
                        <Label key={index} color="blue">
                          {tag}
                        </Label>
                      ))}
                    </LabelGroup>
                  </FlexItem>
                )}
              </Flex>
            </CardBody>
          </Card>
        ))}
      </Gallery>
    </PageSection>
  );
};

export { Pipelines };
