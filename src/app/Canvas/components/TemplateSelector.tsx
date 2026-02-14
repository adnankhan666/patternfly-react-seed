import * as React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Card,
  CardBody,
  CardTitle,
  Gallery,
  GalleryItem,
  Tabs,
  Tab,
  TabTitleText,
  EmptyState,
  EmptyStateBody,
  Title,
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';
import { WORKFLOW_TEMPLATES, WorkflowTemplate, getTemplatesByCategory } from '../../../data/workflowTemplates';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

export const TemplateSelector: React.FunctionComponent<TemplateSelectorProps> = React.memo(({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [activeTab, setActiveTab] = React.useState<string | number>('all');

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  const filteredTemplates = React.useMemo(() => {
    if (activeTab === 'all') {
      return WORKFLOW_TEMPLATES;
    }
    return getTemplatesByCategory(activeTab as WorkflowTemplate['category']);
  }, [activeTab]);

  return (
    <Modal
      variant={ModalVariant.large}
      title="Workflow Templates"
      isOpen={isOpen}
      onClose={onClose}
      aria-label="Workflow template selector"
    >
      <Tabs
        activeKey={activeTab}
        onSelect={(event, tabIndex) => setActiveTab(tabIndex)}
        aria-label="Template categories"
      >
        <Tab eventKey="all" title={<TabTitleText>All Templates</TabTitleText>} />
        <Tab eventKey="ml-pipeline" title={<TabTitleText>ML Pipeline</TabTitleText>} />
        <Tab eventKey="data-processing" title={<TabTitleText>Data Processing</TabTitleText>} />
        <Tab eventKey="deployment" title={<TabTitleText>Deployment</TabTitleText>} />
        <Tab eventKey="monitoring" title={<TabTitleText>Monitoring</TabTitleText>} />
        <Tab eventKey="helm-quickstart" title={<TabTitleText>Helm Quickstart</TabTitleText>} />
      </Tabs>

      <div style={{ marginTop: '24px', maxHeight: '500px', overflowY: 'auto' }}>
        {filteredTemplates.length > 0 ? (
          <Gallery hasGutter minWidths={{ default: '300px' }}>
            {filteredTemplates.map((template) => (
              <GalleryItem key={template.id}>
                <Card
                  isSelectable
                  isClickable
                  onClick={() => handleSelectTemplate(template)}
                  style={{ height: '100%', cursor: 'pointer' }}
                >
                  <CardTitle>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {template.icon && <span style={{ fontSize: '24px' }}>{template.icon}</span>}
                      <span>{template.name}</span>
                    </div>
                  </CardTitle>
                  <CardBody>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
                      {template.description}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          padding: '4px 8px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          color: '#374151',
                        }}
                      >
                        {template.nodes.length} nodes
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          padding: '4px 8px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          color: '#374151',
                        }}
                      >
                        {template.connections.length} connections
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </GalleryItem>
            ))}
          </Gallery>
        ) : (
          <EmptyState>
            <CubesIcon />
            <Title headingLevel="h4" size="lg">
              No templates found
            </Title>
            <EmptyStateBody>
              No workflow templates are available for this category. Try selecting a different category.
            </EmptyStateBody>
          </EmptyState>
        )}
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
});

TemplateSelector.displayName = 'TemplateSelector';
