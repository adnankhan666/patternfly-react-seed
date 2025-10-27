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
} from '@patternfly/react-core';
import { models as modelsData } from '../data';

interface ModelData {
  name: string;
  accuracy: number;
  latency: number;
  throughput: number;
  version: string;
  status: 'Active' | 'Training' | 'Idle';
}

const ModelCatalog: React.FunctionComponent = () => {
  const models: ModelData[] = modelsData as ModelData[];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'green';
      case 'Training':
        return 'blue';
      case 'Idle':
        return 'grey';
      default:
        return 'grey';
    }
  };

  return (
    <PageSection>
      <Title headingLevel="h1" size="2xl" style={{ marginBottom: '20px' }}>
        Model Catalog
      </Title>
      <Gallery hasGutter minWidths={{ default: '100%', md: '350px', lg: '350px', xl: '350px' }}>
        {models.map((model) => (
          <Card key={model.name} isCompact>
            <CardTitle>
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                <FlexItem>
                  <Title headingLevel="h2" size="lg">
                    {model.name}
                  </Title>
                </FlexItem>
                <FlexItem>
                  <Label color={getStatusColor(model.status)}>{model.status}</Label>
                </FlexItem>
              </Flex>
            </CardTitle>
            <CardBody>
              <Grid hasGutter>
                <GridItem span={6}>
                  <DescriptionList isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Version</DescriptionListTerm>
                      <DescriptionListDescription>{model.version}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Accuracy</DescriptionListTerm>
                      <DescriptionListDescription>{model.accuracy}%</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
                <GridItem span={6}>
                  <DescriptionList isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Latency</DescriptionListTerm>
                      <DescriptionListDescription>{model.latency}ms</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Throughput</DescriptionListTerm>
                      <DescriptionListDescription>{model.throughput} req/s</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
              </Grid>
            </CardBody>
          </Card>
        ))}
      </Gallery>
    </PageSection>
  );
};

export { ModelCatalog };
