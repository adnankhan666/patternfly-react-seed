import * as React from 'react';
import {
  PageSection,
  Title,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Label,
  Grid,
  GridItem,
  Card,
  CardBody,
  Flex,
  FlexItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, CubesIcon } from '@patternfly/react-icons';
import { useModels } from '../services/apiService';

const ModelRegistry: React.FunctionComponent = () => {
  const { models, loading, error } = useModels();

  const getStateColor = (state: string) => {
    switch (state) {
      case 'LIVE':
        return 'green';
      case 'ARCHIVED':
        return 'grey';
      case 'UNKNOWN':
        return 'orange';
      default:
        return 'grey';
    }
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
            Loading model registry...
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
            Error loading model registry
          </Title>
          <EmptyStateBody>{error}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (models.length === 0) {
    return (
      <PageSection>
        <EmptyState>
          <CubesIcon size="xl" />
          <Title headingLevel="h1" size="lg">
            No models registered
          </Title>
          <EmptyStateBody>
            No models have been registered in the model registry yet.
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Title headingLevel="h1" size="2xl" style={{ marginBottom: '20px' }}>
        Model Registry
      </Title>
      <p style={{ marginBottom: '20px' }}>
        Register and version your ML models for production deployment
      </p>
      <Grid hasGutter>
        {models.map((model) => (
          <GridItem key={model.modelId} span={12}>
            <Card>
              <CardBody>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>
                      <Title headingLevel="h3" size="lg">
                        {model.name}
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <Label color={getStateColor(model.state)}>{model.state}</Label>
                    </FlexItem>
                  </Flex>

                  {model.description && (
                    <FlexItem>
                      <p>{model.description}</p>
                    </FlexItem>
                  )}

                  <FlexItem>
                    <DescriptionList
                      isHorizontal
                      isCompact
                      columnModifier={{ default: '2Col', lg: '3Col' }}
                    >
                      <DescriptionListGroup>
                        <DescriptionListTerm>Model ID</DescriptionListTerm>
                        <DescriptionListDescription>{model.modelId}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Owner</DescriptionListTerm>
                        <DescriptionListDescription>{model.owner}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Framework</DescriptionListTerm>
                        <DescriptionListDescription>
                          {model.customProperties?.framework || 'N/A'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Version</DescriptionListTerm>
                        <DescriptionListDescription>
                          {model.customProperties?.version || 'N/A'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      {model.customProperties?.accuracy && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Accuracy</DescriptionListTerm>
                          <DescriptionListDescription>
                            {Math.round(model.customProperties.accuracy * 100)}%
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                      {model.externalID && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>External ID</DescriptionListTerm>
                          <DescriptionListDescription>
                            {model.externalID}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                      <DescriptionListGroup>
                        <DescriptionListTerm>Created</DescriptionListTerm>
                        <DescriptionListDescription>
                          {formatDate(model.createdAt)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Last Updated</DescriptionListTerm>
                        <DescriptionListDescription>
                          {formatDate(model.updatedAt)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </FlexItem>

                  {model.customProperties &&
                    Object.keys(model.customProperties).filter(
                      (key) => !['framework', 'version', 'accuracy'].includes(key)
                    ).length > 0 && (
                      <FlexItem>
                        <Title headingLevel="h4" size="md">
                          Additional Properties
                        </Title>
                        <DescriptionList isHorizontal isCompact>
                          {Object.entries(model.customProperties)
                            .filter(([key]) => !['framework', 'version', 'accuracy'].includes(key))
                            .map(([key, value]) => (
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

export { ModelRegistry };
