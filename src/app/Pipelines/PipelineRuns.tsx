import * as React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Label,
  Progress,
  ProgressSize,
  ProgressMeasureLocation,
  Grid,
  GridItem,
  Flex,
  FlexItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, RocketIcon } from '@patternfly/react-icons';
import { useExecutions } from '../services/apiService';

const PipelineRuns: React.FunctionComponent = () => {
  const { executions, loading, error } = useExecutions();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'green';
      case 'RUNNING':
        return 'blue';
      case 'FAILED':
        return 'red';
      case 'CANCELLED':
        return 'orange';
      case 'PENDING':
        return 'grey';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <PageSection>
        <EmptyState>
          <Spinner size="xl" />
          <Title headingLevel="h1" size="lg">
            Loading pipeline runs...
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
            Error loading pipeline runs
          </Title>
          <EmptyStateBody>{error}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (executions.length === 0) {
    return (
      <PageSection>
        <EmptyState>
          <RocketIcon size="xl" />
          <Title headingLevel="h1" size="lg">
            No pipeline runs found
          </Title>
          <EmptyStateBody>
            No pipeline executions have been triggered yet.
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Title headingLevel="h1" size="2xl" style={{ marginBottom: '20px' }}>
        Pipeline Runs
      </Title>
      <Grid hasGutter>
        {executions.map((execution) => (
          <GridItem key={execution.executionId} span={12}>
            <Card isCompact>
              <CardBody>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>
                      <Title headingLevel="h3" size="lg">
                        {execution.workflowName}
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <Label color={getStatusColor(execution.status)}>{execution.status}</Label>
                    </FlexItem>
                  </Flex>

                  <FlexItem>
                    <Progress
                      value={execution.progress}
                      title="Execution Progress"
                      size={ProgressSize.sm}
                      measureLocation={ProgressMeasureLocation.top}
                    />
                  </FlexItem>

                  <FlexItem>
                    <DescriptionList isHorizontal isCompact columnModifier={{ default: '2Col' }}>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Triggered by</DescriptionListTerm>
                        <DescriptionListDescription>
                          {execution.triggeredBy}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Start time</DescriptionListTerm>
                        <DescriptionListDescription>
                          {formatDate(execution.startTime)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Duration</DescriptionListTerm>
                        <DescriptionListDescription>
                          {formatDuration(execution.duration)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Nodes</DescriptionListTerm>
                        <DescriptionListDescription>
                          {execution.completedNodes}/{execution.totalNodes} completed
                          {execution.failedNodes > 0 && `, ${execution.failedNodes} failed`}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </GridItem>
        ))}
      </Grid>
    </PageSection>
  );
};

export { PipelineRuns };
