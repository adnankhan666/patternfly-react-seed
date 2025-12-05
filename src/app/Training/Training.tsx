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
import { ExclamationCircleIcon, CogIcon } from '@patternfly/react-icons';
import { useTrainingJobs } from '../services/apiService';

const Training: React.FunctionComponent = () => {
  const { trainingJobs, loading, error } = useTrainingJobs();

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

  if (loading) {
    return (
      <PageSection>
        <EmptyState>
          <Spinner size="xl" />
          <Title headingLevel="h1" size="lg">
            Loading training jobs...
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
            Error loading training jobs
          </Title>
          <EmptyStateBody>{error}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (trainingJobs.length === 0) {
    return (
      <PageSection>
        <EmptyState>
          <CogIcon size="xl" />
          <Title headingLevel="h1" size="lg">
            No training jobs found
          </Title>
          <EmptyStateBody>
            No model training jobs have been started yet.
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Title headingLevel="h1" size="2xl" style={{ marginBottom: '20px' }}>
        Model Training
      </Title>
      <p style={{ marginBottom: '20px' }}>
        Train machine learning models at scale
      </p>
      <Grid hasGutter>
        {trainingJobs.map((job) => (
          <GridItem key={job.jobId} span={12}>
            <Card>
              <CardBody>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>
                      <Title headingLevel="h3" size="lg">
                        {job.name}
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <Label color={getStatusColor(job.status)}>{job.status}</Label>
                    </FlexItem>
                  </Flex>

                  {job.description && (
                    <FlexItem>
                      <p>{job.description}</p>
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
                        <DescriptionListDescription>{job.framework}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Model Type</DescriptionListTerm>
                        <DescriptionListDescription>{job.modelType || 'N/A'}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Owner</DescriptionListTerm>
                        <DescriptionListDescription>{job.owner}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>CPUs</DescriptionListTerm>
                        <DescriptionListDescription>{job.resources.cpus}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Memory</DescriptionListTerm>
                        <DescriptionListDescription>{job.resources.memory}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>GPUs</DescriptionListTerm>
                        <DescriptionListDescription>{job.resources.gpus}</DescriptionListDescription>
                      </DescriptionListGroup>
                      {job.duration && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Duration</DescriptionListTerm>
                          <DescriptionListDescription>
                            {formatDuration(job.duration)}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                    </DescriptionList>
                  </FlexItem>

                  {job.metrics && Object.keys(job.metrics).length > 0 && (
                    <FlexItem>
                      <Title headingLevel="h4" size="md">
                        Metrics
                      </Title>
                      <DescriptionList isHorizontal isCompact>
                        {Object.entries(job.metrics).map(([key, value]) => (
                          <DescriptionListGroup key={key}>
                            <DescriptionListTerm>{key}</DescriptionListTerm>
                            <DescriptionListDescription>
                              {typeof value === 'number' && key === 'accuracy'
                                ? (value * 100).toFixed(2) + '%'
                                : String(value)}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        ))}
                      </DescriptionList>
                    </FlexItem>
                  )}

                  {job.hyperparameters && Object.keys(job.hyperparameters).length > 0 && (
                    <FlexItem>
                      <Title headingLevel="h4" size="md">
                        Hyperparameters
                      </Title>
                      <DescriptionList isHorizontal isCompact>
                        {Object.entries(job.hyperparameters).map(([key, value]) => (
                          <DescriptionListGroup key={key}>
                            <DescriptionListTerm>{key}</DescriptionListTerm>
                            <DescriptionListDescription>{String(value)}</DescriptionListDescription>
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

export { Training };
