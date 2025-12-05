import * as React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Grid,
  GridItem,
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
} from '@patternfly/react-core';
import { ExclamationCircleIcon, FlaskIcon } from '@patternfly/react-icons';
import { useExperiments } from '../services/apiService';

const Experiments: React.FunctionComponent = () => {
  const { experiments, loading, error } = useExperiments();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'blue';
      case 'COMPLETED':
        return 'green';
      case 'FAILED':
        return 'red';
      case 'CANCELLED':
        return 'orange';
      default:
        return 'grey';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <PageSection>
        <EmptyState>
          <Spinner size="xl" />
          <Title headingLevel="h1" size="lg">
            Loading experiments...
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
            Error loading experiments
          </Title>
          <EmptyStateBody>{error}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (experiments.length === 0) {
    return (
      <PageSection>
        <EmptyState>
          <FlaskIcon size="xl" />
          <Title headingLevel="h1" size="lg">
            No experiments found
          </Title>
          <EmptyStateBody>
            No ML experiments have been run yet.
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Title headingLevel="h1" size="2xl" style={{ marginBottom: '20px' }}>
        Experiments and Runs
      </Title>
      <p style={{ marginBottom: '20px' }}>
        Track and compare your ML experiments
      </p>
      <Grid hasGutter>
        {experiments.map((experiment) => (
          <GridItem key={experiment.experimentId} span={12}>
            <Card>
              <CardBody>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>
                      <Title headingLevel="h3" size="lg">
                        {experiment.name}
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <Label color={getStatusColor(experiment.status)}>{experiment.status}</Label>
                    </FlexItem>
                  </Flex>

                  {experiment.description && (
                    <FlexItem>
                      <p>{experiment.description}</p>
                    </FlexItem>
                  )}

                  <FlexItem>
                    <DescriptionList
                      isHorizontal
                      isCompact
                      columnModifier={{ default: '2Col', lg: '3Col' }}
                    >
                      <DescriptionListGroup>
                        <DescriptionListTerm>Framework</DescriptionListTerm>
                        <DescriptionListDescription>{experiment.framework}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Owner</DescriptionListTerm>
                        <DescriptionListDescription>{experiment.owner}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Duration</DescriptionListTerm>
                        <DescriptionListDescription>
                          {formatDuration(experiment.duration)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </FlexItem>

                  {experiment.metrics && Object.keys(experiment.metrics).length > 0 && (
                    <FlexItem>
                      <Title headingLevel="h4" size="md">
                        Metrics
                      </Title>
                      <DescriptionList isHorizontal isCompact>
                        {Object.entries(experiment.metrics).map(([key, value]) => (
                          <DescriptionListGroup key={key}>
                            <DescriptionListTerm>{key}</DescriptionListTerm>
                            <DescriptionListDescription>
                              {typeof value === 'number' && value < 1 ? (value * 100).toFixed(2) + '%' : value}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        ))}
                      </DescriptionList>
                    </FlexItem>
                  )}

                  {experiment.parameters && Object.keys(experiment.parameters).length > 0 && (
                    <FlexItem>
                      <Title headingLevel="h4" size="md">
                        Parameters
                      </Title>
                      <DescriptionList isHorizontal isCompact>
                        {Object.entries(experiment.parameters).map(([key, value]) => (
                          <DescriptionListGroup key={key}>
                            <DescriptionListTerm>{key}</DescriptionListTerm>
                            <DescriptionListDescription>
                              {String(value)}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        ))}
                      </DescriptionList>
                    </FlexItem>
                  )}
                </Flex>
              </CardBody>
            </Card>
          </GridItem>
        ))}
      </Grid>
    </PageSection>
  );
};

export { Experiments };
