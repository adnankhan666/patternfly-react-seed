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
} from '@patternfly/react-core';
import { ExclamationCircleIcon, BookOpenIcon } from '@patternfly/react-icons';
import { useNotebooks } from '../services/apiService';

const Notebooks: React.FunctionComponent = () => {
  const { notebooks, loading, error } = useNotebooks();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'green';
      case 'STOPPED':
        return 'grey';
      case 'STARTING':
        return 'blue';
      case 'STOPPING':
        return 'orange';
      case 'ERROR':
        return 'red';
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
            Loading notebooks...
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
            Error loading notebooks
          </Title>
          <EmptyStateBody>{error}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (notebooks.length === 0) {
    return (
      <PageSection>
        <EmptyState>
          <BookOpenIcon size="xl" />
          <Title headingLevel="h1" size="lg">
            No notebooks found
          </Title>
          <EmptyStateBody>
            No Jupyter notebooks have been created yet.
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Title headingLevel="h1" size="2xl" style={{ marginBottom: '20px' }}>
        Jupyter Notebooks
      </Title>
      <p style={{ marginBottom: '20px' }}>
        Create and manage Jupyter notebooks for data science work
      </p>
      <Gallery hasGutter minWidths={{ default: '100%', md: '400px', lg: '400px', xl: '400px' }}>
        {notebooks.map((notebook) => (
          <Card key={notebook.notebookId} isCompact>
            <CardBody>
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                  <FlexItem>
                    <Title headingLevel="h2" size="lg">
                      {notebook.name}
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <Label color={getStatusColor(notebook.status)}>{notebook.status}</Label>
                  </FlexItem>
                </Flex>

                {notebook.description && (
                  <FlexItem>
                    <p>{notebook.description}</p>
                  </FlexItem>
                )}

                <FlexItem>
                  <DescriptionList isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Owner</DescriptionListTerm>
                      <DescriptionListDescription>{notebook.owner}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Image</DescriptionListTerm>
                      <DescriptionListDescription>{notebook.image}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Size</DescriptionListTerm>
                      <DescriptionListDescription>{notebook.size}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>GPUs</DescriptionListTerm>
                      <DescriptionListDescription>{notebook.gpus}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Storage</DescriptionListTerm>
                      <DescriptionListDescription>{notebook.storageSize}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Last Activity</DescriptionListTerm>
                      <DescriptionListDescription>
                        {formatDate(notebook.lastActivity)}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </Gallery>
    </PageSection>
  );
};

export { Notebooks };
