import * as React from 'react';
import {
  Card,
  CardTitle,
  CardBody,
  Gallery,
  PageSection,
  Title,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Spinner,
  EmptyState,
  EmptyStateBody,
} from '@patternfly/react-core';
import { CubesIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import { useModels } from '../services/apiService';

const ModelCatalog: React.FunctionComponent = () => {
  const { models, loading, error } = useModels();

  const getStatusColor = (state: string) => {
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

  if (loading) {
    return (
      <PageSection>
        <EmptyState>
          <Spinner size="xl" />
          <Title headingLevel="h1" size="lg">
            Loading models...
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
            Error loading models
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
            No models found
          </Title>
          <EmptyStateBody>
            No models are currently registered in the catalog.
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Title headingLevel="h1" size="2xl" style={{ marginBottom: '20px' }}>
        Model Catalog
      </Title>
      <Gallery hasGutter minWidths={{ default: '100%', md: '350px', lg: '350px', xl: '350px' }}>
        {models.map((model) => (
          <Card key={model.modelId} isCompact>
            <CardTitle>
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                <FlexItem>
                  <Title headingLevel="h2" size="lg">
                    {model.name}
                  </Title>
                </FlexItem>
                <FlexItem>
                  <Label color={getStatusColor(model.state)}>{model.state}</Label>
                </FlexItem>
              </Flex>
            </CardTitle>
            <CardBody>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Description</DescriptionListTerm>
                  <DescriptionListDescription>
                    {model.description || 'No description'}
                  </DescriptionListDescription>
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
              </DescriptionList>
            </CardBody>
          </Card>
        ))}
      </Gallery>
    </PageSection>
  );
};

export { ModelCatalog };
