import * as React from 'react';
import {
  PageSection,
  Title,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  Button,
  Modal,
  ModalVariant,
  ModalBody,
  Form,
  FormGroup,
  TextInput,
  Card,
  CardBody,
  Gallery,
  GalleryItem,
  Flex,
  FlexItem,
  Content,
} from '@patternfly/react-core';
import { PlusCircleIcon, TrashIcon, FolderOpenIcon, RocketIcon, CubeIcon } from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import { getBYOHDeployments, BYOHDeploymentRecord } from '../../data/byohChartCatalog';

const Canvas: React.FunctionComponent = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [projectName, setProjectName] = React.useState('');
  const [projects, setProjects] = React.useState<string[]>([]);
  const [byohDeployments, setByohDeployments] = React.useState<BYOHDeploymentRecord[]>([]);
  const navigate = useNavigate();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const loadProjects = React.useCallback(() => {
    const stored = JSON.parse(localStorage.getItem('canvasProjects') || '[]');
    setProjects(stored);
    setByohDeployments(getBYOHDeployments());
  }, []);

  React.useEffect(() => {
    loadProjects();
    window.addEventListener('projectsUpdated', loadProjects);
    window.addEventListener('storage', loadProjects);
    return () => {
      window.removeEventListener('projectsUpdated', loadProjects);
      window.removeEventListener('storage', loadProjects);
    };
  }, [loadProjects]);

  React.useEffect(() => {
    if (!isModalOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isModalOpen]);

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
    setProjectName('');
  };

  const handleCreateProject = () => {
    if (projectName.trim()) {
      const urlFriendlyName = projectName.toLowerCase().replace(/\s+/g, '-');
      const existingProjects = JSON.parse(localStorage.getItem('canvasProjects') || '[]');
      if (!existingProjects.includes(projectName)) {
        existingProjects.push(projectName);
        localStorage.setItem('canvasProjects', JSON.stringify(existingProjects));
        window.dispatchEvent(new Event('projectsUpdated'));
      }
      navigate(`/canvas/${urlFriendlyName}`);
      handleModalToggle();
    }
  };

  const handleDeleteProject = (project: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const existing = JSON.parse(localStorage.getItem('canvasProjects') || '[]');
    const updated = existing.filter((p: string) => p !== project);
    localStorage.setItem('canvasProjects', JSON.stringify(updated));

    const slug = project.toLowerCase().replace(/\s+/g, '-');
    localStorage.removeItem(`workflow-${slug}`);

    window.dispatchEvent(new Event('projectsUpdated'));
    setProjects(updated);
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        {projects.length === 0 ? (
          <EmptyState>
            <Title headingLevel="h1" size="lg">
              Canvas
            </Title>
            <EmptyStateBody>
              Create and manage your workflows visually. Start your first project or use a quickstart template.
            </EmptyStateBody>
            <EmptyStateActions>
              <Button variant="primary" icon={<PlusCircleIcon />} onClick={handleModalToggle}>
                Create Project
              </Button>
              <Button variant="link" icon={<RocketIcon />} onClick={() => navigate('/plugins/quickstarts')}>
                Quickstart Template
              </Button>
            </EmptyStateActions>
          </EmptyState>
        ) : (
          <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
            <FlexItem>
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>
                  <Content>
                    <Title headingLevel="h1" size="xl">Canvas Projects</Title>
                    <p style={{ color: '#6b7280' }}>
                      {projects.length} project{projects.length !== 1 ? 's' : ''}
                    </p>
                  </Content>
                </FlexItem>
                <FlexItem>
                  <Flex gap={{ default: 'gapSm' }}>
                    <FlexItem>
                      <Button variant="primary" icon={<PlusCircleIcon />} onClick={handleModalToggle}>
                        New Project
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <Button variant="secondary" icon={<RocketIcon />} onClick={() => navigate('/plugins/quickstarts')}>
                        Quickstart
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <Button variant="secondary" icon={<CubeIcon />} onClick={() => navigate('/plugins/quickstarts')}>
                        Helm Chart
                      </Button>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </Flex>
            </FlexItem>
            <FlexItem>
              <Gallery hasGutter minWidths={{ default: '280px' }}>
                {projects.map((project) => {
                  const slug = project.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <GalleryItem key={project}>
                      <Card
                        isCompact
                        isFullHeight
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/canvas/${slug}`)}
                      >
                        <CardBody>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                            <FlexItem>
                              <FolderOpenIcon style={{ fontSize: '1.5rem', color: '#8b5cf6' }} />
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <div style={{ fontWeight: 600 }}>{project}</div>
                              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                /canvas/{slug}
                              </div>
                            </FlexItem>
                            <FlexItem>
                              <Button
                                variant="plain"
                                icon={<TrashIcon />}
                                onClick={(e) => handleDeleteProject(project, e)}
                                aria-label={`Delete ${project}`}
                                style={{ color: '#dc2626' }}
                              />
                            </FlexItem>
                          </Flex>
                        </CardBody>
                      </Card>
                    </GalleryItem>
                  );
                })}
              </Gallery>
            </FlexItem>
            {byohDeployments.length > 0 && (
              <FlexItem>
                <Content style={{ marginBottom: '12px' }}>
                  <Title headingLevel="h2" size="lg">Recent BYOH Deployments</Title>
                  <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
                    Helm charts deployed via the BYOH wizard
                  </p>
                </Content>
                <Flex gap={{ default: 'gapSm' }} style={{ flexWrap: 'wrap' }}>
                  {byohDeployments.slice(0, 8).map((deployment) => {
                    const slug = deployment.releaseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    return (
                      <FlexItem key={deployment.releaseName}>
                        <Button
                          variant="plain"
                          onClick={() => navigate(`/canvas/${slug}`)}
                          style={{
                            border: '1px solid #d1d5db',
                            borderRadius: '16px',
                            padding: '6px 14px',
                            fontSize: '0.85rem',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{deployment.releaseName}</span>
                          <span style={{ color: '#9ca3af', marginLeft: '8px' }}>
                            {deployment.chartName}
                          </span>
                          <span style={{ color: '#d1d5db', margin: '0 6px' }}>·</span>
                          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                            {new Date(deployment.timestamp).toLocaleDateString()}
                          </span>
                        </Button>
                      </FlexItem>
                    );
                  })}
                </Flex>
              </FlexItem>
            )}
          </Flex>
        )}
      </PageSection>

      <Modal
        variant={ModalVariant.small}
        title="Create Data Science Project"
        isOpen={isModalOpen}
        onClose={handleModalToggle}
      >
        <ModalBody>
          <Form>
            <FormGroup label="Enter your Data Science project name" isRequired fieldId="project-name">
              <TextInput
                isRequired
                ref={inputRef}
                type="text"
                id="project-name"
                name="project-name"
                value={projectName}
                onChange={(_event, value) => setProjectName(value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateProject();
                  }
                }}
              />
            </FormGroup>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <Button variant="primary" onClick={handleCreateProject}>
                Let's Start
              </Button>
              <Button variant="link" onClick={handleModalToggle}>
                Cancel
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </>
  );
};

export { Canvas };
