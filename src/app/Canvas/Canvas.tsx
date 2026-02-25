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
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';

const Canvas: React.FunctionComponent = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [projectName, setProjectName] = React.useState('');
  const navigate = useNavigate();

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
    setProjectName('');
  };

  const handleCreateProject = () => {
    if (projectName.trim()) {
      // Convert project name to URL-friendly format
      const urlFriendlyName = projectName.toLowerCase().replace(/\s+/g, '-');

      // Store the project in localStorage
      const existingProjects = JSON.parse(localStorage.getItem('canvasProjects') || '[]');
      if (!existingProjects.includes(projectName)) {
        existingProjects.push(projectName);
        localStorage.setItem('canvasProjects', JSON.stringify(existingProjects));

        // Dispatch custom event to update navigation
        window.dispatchEvent(new Event('projectsUpdated'));
      }

      // Navigate to the new project page
      navigate(`/canvas/${urlFriendlyName}`);
      handleModalToggle();
    }
  };

  return (
    <>
      <PageSection>
        <EmptyState>
          <Title headingLevel="h1" size="lg">
            Canvas
          </Title>
          <EmptyStateBody>Create and manage your workflows visually</EmptyStateBody>
          <EmptyStateActions>
            <Button variant="link" icon={<PlusCircleIcon />} onClick={handleModalToggle}>
              Add Project
            </Button>
          </EmptyStateActions>
        </EmptyState>
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
