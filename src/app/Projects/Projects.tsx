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
  LabelGroup,
  Spinner,
  EmptyState,
  EmptyStateBody,
} from '@patternfly/react-core';
import { CubeIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import { useProjects } from '../services/apiService';

const Projects: React.FunctionComponent = () => {
  const { projects, loading, error } = useProjects();

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'Active':
        return 'green';
      case 'Terminating':
        return 'red';
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
            Loading projects...
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
            Error loading projects
          </Title>
          <EmptyStateBody>{error}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (projects.length === 0) {
    return (
      <PageSection>
        <EmptyState>
          <CubeIcon size="xl" />
          <Title headingLevel="h1" size="lg">
            No projects found
          </Title>
          <EmptyStateBody>
            No data science projects are currently registered.
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Title headingLevel="h1" size="2xl" style={{ marginBottom: '20px' }}>
        Data Science Projects
      </Title>
      <Gallery hasGutter minWidths={{ default: '100%', md: '350px', lg: '350px', xl: '350px' }}>
        {projects.map((project) => (
          <Card key={project.projectId} isCompact>
            <CardTitle>
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                <FlexItem>
                  <Title headingLevel="h2" size="lg">
                    {project.displayName || project.name}
                  </Title>
                </FlexItem>
                <FlexItem>
                  <Label color={getPhaseColor(project.phase)}>{project.phase}</Label>
                </FlexItem>
              </Flex>
            </CardTitle>
            <CardBody>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Description</DescriptionListTerm>
                  <DescriptionListDescription>
                    {project.description || 'No description'}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Owner</DescriptionListTerm>
                  <DescriptionListDescription>{project.owner}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Workflows</DescriptionListTerm>
                  <DescriptionListDescription>
                    {project.workflowCount || 0}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {project.tags && project.tags.length > 0 && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Tags</DescriptionListTerm>
                    <DescriptionListDescription>
                      <LabelGroup>
                        {project.tags.map((tag, index) => (
                          <Label key={index} color="blue">
                            {tag}
                          </Label>
                        ))}
                      </LabelGroup>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
                {project.collaborators && project.collaborators.length > 0 && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Collaborators</DescriptionListTerm>
                    <DescriptionListDescription>
                      {project.collaborators.join(', ')}
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

export { Projects };
