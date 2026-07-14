import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardFooter,
  Gallery,
  GalleryItem,
  Button,
  Flex,
  FlexItem,
  Content,
  TextInput,
  FormGroup,
  Label,
  Alert,
  Divider,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  RocketIcon,
  CheckCircleIcon,
} from '@patternfly/react-icons';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '../../../data/workflowTemplates';

type WizardStep = 'choose' | 'configure' | 'launch';

const categoryLabels: Record<string, string> = {
  'ml-pipeline': 'ML Pipeline',
  'data-processing': 'Data Processing',
  'deployment': 'Deployment',
  'monitoring': 'Monitoring',
  'helm-quickstart': 'Helm Quickstart',
};

const categoryColors: Record<string, string> = {
  'ml-pipeline': '#8b5cf6',
  'data-processing': '#06b6d4',
  'deployment': '#f59e0b',
  'monitoring': '#10b981',
  'helm-quickstart': '#ec4899',
};

const categoryIcons: Record<string, string> = {
  'ml-pipeline': '\uD83E\uDD16',
  'data-processing': '\uD83D\uDD04',
  'deployment': '\uD83D\uDE80',
  'monitoring': '\uD83D\uDCCA',
  'helm-quickstart': '\u2699\uFE0F',
};

const QuickstartWizard: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<WizardStep>('choose');
  const [selectedTemplate, setSelectedTemplate] = React.useState<WorkflowTemplate | null>(null);
  const [projectName, setProjectName] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [launched, setLaunched] = React.useState(false);

  const filteredTemplates = activeCategory
    ? WORKFLOW_TEMPLATES.filter((t) => t.category === activeCategory)
    : WORKFLOW_TEMPLATES;

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    const slug = template.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setProjectName(slug);
    setStep('configure');
  };

  const createProjectAndLoadTemplate = (): string => {
    const slug = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'quickstart-project';
    const existingProjects = JSON.parse(localStorage.getItem('canvasProjects') || '[]');
    const displayName = projectName || 'Quickstart Project';
    if (!existingProjects.includes(displayName)) {
      existingProjects.push(displayName);
      localStorage.setItem('canvasProjects', JSON.stringify(existingProjects));
    }

    if (selectedTemplate) {
      const now = new Date().toISOString();
      const nodes = selectedTemplate.nodes.map((n, idx) => ({
        ...n,
        id: `${n.id}-${Date.now()}-${idx}`,
      }));
      const idMap = new Map<string, string>();
      selectedTemplate.nodes.forEach((orig, idx) => {
        idMap.set(orig.id, nodes[idx].id);
      });
      const connections = selectedTemplate.connections.map((c, idx) => ({
        ...c,
        id: `conn-${Date.now()}-${idx}`,
        source: idMap.get(c.source) || c.source,
        target: idMap.get(c.target) || c.target,
      }));
      const workflowData = {
        projectName: slug,
        nodes,
        connections,
        timestamp: now,
        templateId: selectedTemplate.id,
      };
      localStorage.setItem(`workflow-${slug}`, JSON.stringify(workflowData));
    }

    window.dispatchEvent(new Event('projectsUpdated'));
    return slug;
  };

  const handleOpenInCanvas = () => {
    const slug = createProjectAndLoadTemplate();
    navigate(`/canvas/${slug}`);
  };

  const handleDeployNow = () => {
    const slug = createProjectAndLoadTemplate();
    setLaunched(true);
    setStep('launch');
    setTimeout(() => {
      navigate(`/canvas/${slug}`);
    }, 2000);
  };

  return (
    <PageSection hasBodyWrapper={false}>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }} style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <FlexItem>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
            <FlexItem>
              <Button variant="plain" icon={<ArrowLeftIcon />} onClick={() => {
                if (step === 'configure') setStep('choose');
                else if (step === 'launch') setStep('configure');
                else navigate(-1);
              }} aria-label="Go back" />
            </FlexItem>
            <FlexItem>
              <Title headingLevel="h1" size="2xl">
                <RocketIcon style={{ marginRight: '8px', color: '#8b5cf6' }} />
                Quickstart
              </Title>
            </FlexItem>
          </Flex>
          <Flex gap={{ default: 'gapMd' }} style={{ marginTop: '12px', marginLeft: '48px' }}>
            <FlexItem>
              <Label color={step === 'choose' ? 'blue' : 'grey'} isCompact>1. Choose Template</Label>
            </FlexItem>
            <FlexItem><ArrowRightIcon style={{ color: '#d1d5db' }} /></FlexItem>
            <FlexItem>
              <Label color={step === 'configure' ? 'blue' : 'grey'} isCompact>2. Configure</Label>
            </FlexItem>
            <FlexItem><ArrowRightIcon style={{ color: '#d1d5db' }} /></FlexItem>
            <FlexItem>
              <Label color={step === 'launch' ? 'green' : 'grey'} isCompact>3. Launch</Label>
            </FlexItem>
          </Flex>
        </FlexItem>

        <Divider />

        {/* Step 1: Choose Template */}
        {step === 'choose' && (
          <FlexItem>
            <Content style={{ marginBottom: '16px' }}>
              <p style={{ color: '#6b7280' }}>
                Pick a pre-built workflow template to get started quickly.
              </p>
            </Content>

            {/* Category filter chips */}
            <Flex gap={{ default: 'gapSm' }} style={{ marginBottom: '20px' }} wrap={{ default: 'wrap' }}>
              <FlexItem>
                <Button
                  variant={activeCategory === null ? 'primary' : 'secondary'}
                  isSmall
                  onClick={() => setActiveCategory(null)}
                >
                  All
                </Button>
              </FlexItem>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <FlexItem key={key}>
                  <Button
                    variant={activeCategory === key ? 'primary' : 'secondary'}
                    isSmall
                    onClick={() => setActiveCategory(activeCategory === key ? null : key)}
                    style={activeCategory === key ? { background: categoryColors[key], borderColor: categoryColors[key] } : {}}
                  >
                    {categoryIcons[key]} {label}
                  </Button>
                </FlexItem>
              ))}
            </Flex>

            <Gallery hasGutter minWidths={{ default: '300px' }}>
              {filteredTemplates.map((template) => {
                const color = categoryColors[template.category] || '#6b7280';
                return (
                  <GalleryItem key={template.id}>
                    <Card
                      isFullHeight
                      isSelectable
                      isSelected={selectedTemplate?.id === template.id}
                      onClick={() => handleSelectTemplate(template)}
                      style={{ cursor: 'pointer', borderTop: `3px solid ${color}` }}
                    >
                      <CardHeader>
                        <CardTitle>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                            <FlexItem>
                              <span style={{ fontSize: '2rem' }}>
                                {template.icon || categoryIcons[template.category] || '\uD83D\uDCE6'}
                              </span>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{template.name}</span>
                            </FlexItem>
                          </Flex>
                        </CardTitle>
                      </CardHeader>
                      <CardBody>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 12px' }}>
                          {template.description}
                        </p>
                        <Flex gap={{ default: 'gapSm' }} wrap={{ default: 'wrap' }}>
                          {[...new Set(template.nodes.map((n) => n.type))].map((type) => (
                            <Label key={type} isCompact color="blue">{type}</Label>
                          ))}
                        </Flex>
                      </CardBody>
                      <CardFooter>
                        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <Label isCompact style={{ background: `${color}20`, color }}>{categoryLabels[template.category]}</Label>
                          </FlexItem>
                          <FlexItem>
                            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                              {template.nodes.length} nodes &middot; {template.connections.length} connections
                            </span>
                          </FlexItem>
                        </Flex>
                      </CardFooter>
                    </Card>
                  </GalleryItem>
                );
              })}
            </Gallery>
          </FlexItem>
        )}

        {/* Step 2: Configure */}
        {step === 'configure' && selectedTemplate && (
          <FlexItem>
            <Card style={{ borderTop: `3px solid ${categoryColors[selectedTemplate.category] || '#6b7280'}` }}>
              <CardBody>
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
                  <FlexItem>
                    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                      <FlexItem>
                        <span style={{ fontSize: '2.5rem' }}>
                          {selectedTemplate.icon || categoryIcons[selectedTemplate.category] || '\uD83D\uDCE6'}
                        </span>
                      </FlexItem>
                      <FlexItem>
                        <Title headingLevel="h2" size="xl">{selectedTemplate.name}</Title>
                        <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
                          {selectedTemplate.description}
                        </p>
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <Divider />

                  <FlexItem>
                    <FormGroup label="Project Name" isRequired fieldId="qs-project-name">
                      <TextInput
                        isRequired
                        id="qs-project-name"
                        value={projectName}
                        onChange={(_e, val) => setProjectName(val)}
                      />
                    </FormGroup>
                  </FlexItem>

                  <FlexItem>
                    <DescriptionList isHorizontal>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Category</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Label>{categoryLabels[selectedTemplate.category]}</Label>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Workflow Nodes</DescriptionListTerm>
                        <DescriptionListDescription>{selectedTemplate.nodes.length}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Connections</DescriptionListTerm>
                        <DescriptionListDescription>{selectedTemplate.connections.length}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Node Types</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Flex gap={{ default: 'gapSm' }} wrap={{ default: 'wrap' }}>
                            {[...new Set(selectedTemplate.nodes.map((n) => n.type))].map((type) => (
                              <Label key={type} isCompact color="blue">{type}</Label>
                            ))}
                          </Flex>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </FlexItem>

                  <Divider />

                  <FlexItem>
                    <Flex gap={{ default: 'gapMd' }}>
                      <FlexItem>
                        <Button
                          variant="primary"
                          icon={<ArrowRightIcon />}
                          iconPosition="end"
                          onClick={handleOpenInCanvas}
                          isDisabled={!projectName.trim()}
                        >
                          Open in Canvas
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="secondary"
                          icon={<RocketIcon />}
                          onClick={handleDeployNow}
                          isDisabled={!projectName.trim()}
                        >
                          Deploy Now
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button variant="link" onClick={() => setStep('choose')}>
                          Back to Templates
                        </Button>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </FlexItem>
        )}

        {/* Step 3: Launch */}
        {step === 'launch' && launched && (
          <FlexItem>
            <Card>
              <CardBody>
                <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapLg' }} style={{ padding: '3rem' }}>
                  <FlexItem>
                    <CheckCircleIcon style={{ fontSize: '4rem', color: '#16a34a' }} />
                  </FlexItem>
                  <FlexItem>
                    <Title headingLevel="h2" size="xl">Project Created</Title>
                  </FlexItem>
                  <FlexItem>
                    <Alert variant="success" isInline isPlain title="Your project has been created and the template has been loaded. Redirecting to canvas..." />
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </FlexItem>
        )}
      </Flex>
    </PageSection>
  );
};

export { QuickstartWizard };
