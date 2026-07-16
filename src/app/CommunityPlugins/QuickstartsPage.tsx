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
  Divider,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Tabs,
  Tab,
  TabTitleText,
  EmptyState,
  EmptyStateBody,
} from '@patternfly/react-core';
import {
  ArrowRightIcon,
  RocketIcon,
  CheckCircleIcon,
  ExternalLinkAltIcon,
} from '@patternfly/react-icons';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '../../data/workflowTemplates';
import { markCanvasLoadingTransition } from '../Canvas/utils/canvasLoadingTransition';
import { DeployPhaseChecklist, DEPLOY_PHASE_ORDER } from '../components/DeployPhaseChecklist';
import { CommunityPluginsBreadcrumb } from './CommunityPluginsBreadcrumb';

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

interface DeployedQuickstart {
  projectName: string;
  slug: string;
  templateId: string;
  templateName: string;
  category: string;
  timestamp: string;
  nodeCount: number;
}

function getDeployedQuickstarts(): DeployedQuickstart[] {
  const projects: string[] = JSON.parse(localStorage.getItem('canvasProjects') || '[]');
  const results: DeployedQuickstart[] = [];

  for (const project of projects) {
    const slug = project.toLowerCase().replace(/\s+/g, '-');
    const raw = localStorage.getItem(`workflow-${slug}`);
    if (!raw) continue;
    try {
      const data = JSON.parse(raw);
      if (!data.templateId) continue;
      const template = WORKFLOW_TEMPLATES.find((t) => t.id === data.templateId);
      if (!template) continue;
      results.push({
        projectName: project,
        slug,
        templateId: data.templateId,
        templateName: template.name,
        category: template.category,
        timestamp: data.timestamp || '',
        nodeCount: (data.nodes || data.projectWorkflows?.[0]?.nodes || []).length,
      });
    } catch {
      // skip corrupt entries
    }
  }

  return results;
}

const QuickstartsPage: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<string | number>(0);
  const [step, setStep] = React.useState<WizardStep>('choose');
  const [selectedTemplate, setSelectedTemplate] = React.useState<WorkflowTemplate | null>(null);
  const [projectName, setProjectName] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [launched, setLaunched] = React.useState(false);
  const [deployPhaseIndex, setDeployPhaseIndex] = React.useState(0);
  const [deploySlug, setDeploySlug] = React.useState<string | null>(null);
  const [deployComplete, setDeployComplete] = React.useState(false);
  const [deployedQuickstarts, setDeployedQuickstarts] = React.useState<DeployedQuickstart[]>([]);

  React.useEffect(() => {
    setDeployedQuickstarts(getDeployedQuickstarts());
    const onUpdate = () => setDeployedQuickstarts(getDeployedQuickstarts());
    window.addEventListener('storage', onUpdate);
    window.addEventListener('projectsUpdated', onUpdate);
    return () => {
      window.removeEventListener('storage', onUpdate);
      window.removeEventListener('projectsUpdated', onUpdate);
    };
  }, []);

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
    setDeployedQuickstarts(getDeployedQuickstarts());
    return slug;
  };

  const handleOpenInCanvas = () => {
    const slug = createProjectAndLoadTemplate();
    markCanvasLoadingTransition();
    navigate(`/canvas/${slug}?deployed=true`);
  };

  const handleDeployNow = () => {
    const slug = createProjectAndLoadTemplate();
    setDeploySlug(slug);
    setDeployPhaseIndex(0);
    setDeployComplete(false);
    setLaunched(true);
    setStep('launch');
  };

  React.useEffect(() => {
    if (step !== 'launch' || !launched || !deploySlug) return undefined;

    if (deployPhaseIndex < DEPLOY_PHASE_ORDER.length - 1) {
      const timer = window.setTimeout(() => {
        setDeployPhaseIndex((prev) => prev + 1);
      }, 500);
      return () => window.clearTimeout(timer);
    }

    setDeployComplete(true);
    const navigateTimer = window.setTimeout(() => {
      navigate(`/canvas/${deploySlug}?autoExecute=true`);
    }, 600);
    return () => window.clearTimeout(navigateTimer);
  }, [step, launched, deploySlug, deployPhaseIndex, navigate]);

  return (
    <PageSection hasBodyWrapper={false} style={{ paddingTop: '16px', paddingBottom: '16px' }}>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        <FlexItem>
          <CommunityPluginsBreadcrumb items={[{ label: 'Quickstarts' }]} />
          <Title headingLevel="h1" size="xl">
            <RocketIcon style={{ marginRight: '8px', color: '#8b5cf6' }} />
            Quickstarts
          </Title>
          <Content>
            <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '0.9rem' }}>
              Pre-built workflow templates to get you started quickly
            </p>
          </Content>
        </FlexItem>

        <FlexItem>
          <Tabs
            activeKey={activeTab}
            onSelect={(_event, tabIndex) => setActiveTab(tabIndex)}
            aria-label="Quickstarts tabs"
          >
            <Tab eventKey={0} title={<TabTitleText><RocketIcon style={{ marginRight: '6px' }} />Templates</TabTitleText>}>
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} style={{ marginTop: '12px' }}>
                <FlexItem>
                  <Flex gap={{ default: 'gapMd' }} style={{ marginBottom: '4px' }}>
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

                {step === 'choose' && (
                  <FlexItem>
                    <Flex gap={{ default: 'gapSm' }} style={{ marginBottom: '12px' }} wrap={{ default: 'wrap' }}>
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

                    <Gallery hasGutter minWidths={{ default: '240px' }} maxWidths={{ default: '1fr' }}>
                      {filteredTemplates.map((template) => {
                        const color = categoryColors[template.category] || '#6b7280';
                        return (
                          <GalleryItem key={template.id}>
                            <Card
                              isCompact
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
                                      <span style={{ fontSize: '1.5rem' }}>
                                        {template.icon || categoryIcons[template.category] || '\uD83D\uDCE6'}
                                      </span>
                                    </FlexItem>
                                    <FlexItem flex={{ default: 'flex_1' }}>
                                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{template.name}</span>
                                    </FlexItem>
                                  </Flex>
                                </CardTitle>
                              </CardHeader>
                              <CardBody>
                                <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 10px' }}>
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
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
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

                {step === 'configure' && selectedTemplate && (
                  <FlexItem>
                    <Card style={{ borderTop: `3px solid ${categoryColors[selectedTemplate.category] || '#6b7280'}` }}>
                      <CardBody>
                        <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
                          <FlexItem>
                            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                              <FlexItem>
                                <span style={{ fontSize: '2rem' }}>
                                  {selectedTemplate.icon || categoryIcons[selectedTemplate.category] || '\uD83D\uDCE6'}
                                </span>
                              </FlexItem>
                              <FlexItem>
                                <Title headingLevel="h2" size="lg">{selectedTemplate.name}</Title>
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

                {step === 'launch' && launched && (
                  <FlexItem>
                    <Card>
                      <CardBody>
                        <DeployPhaseChecklist
                          title={deployComplete ? 'Launch complete' : `Deploying ${projectName}...`}
                          subtitle={
                            deployComplete
                              ? 'Redirecting to canvas to continue deployment...'
                              : 'Preparing your workflow resources'
                          }
                          activePhaseIndex={deployPhaseIndex}
                          isComplete={deployComplete}
                        />
                      </CardBody>
                    </Card>
                  </FlexItem>
                )}
              </Flex>
            </Tab>

            <Tab eventKey={1} title={<TabTitleText><CheckCircleIcon style={{ marginRight: '6px' }} />Deployed Quickstarts{deployedQuickstarts.length > 0 ? ` (${deployedQuickstarts.length})` : ''}</TabTitleText>}>
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} style={{ marginTop: '12px', padding: '4px 0' }}>
                {deployedQuickstarts.length === 0 ? (
                  <FlexItem>
                    <EmptyState>
                      <Title headingLevel="h4" size="md">No Deployed Quickstarts</Title>
                      <EmptyStateBody>
                        Deploy a quickstart template to see it here. Your launched projects will appear with direct links to their canvas.
                      </EmptyStateBody>
                    </EmptyState>
                  </FlexItem>
                ) : (
                  <FlexItem>
                    <Gallery hasGutter minWidths={{ default: '300px' }} maxWidths={{ default: '1fr' }}>
                      {deployedQuickstarts.map((qs) => {
                        const color = categoryColors[qs.category] || '#6b7280';
                        const icon = categoryIcons[qs.category] || '\uD83D\uDCE6';
                        const template = WORKFLOW_TEMPLATES.find((t) => t.id === qs.templateId);
                        return (
                          <GalleryItem key={qs.slug}>
                            <Card
                              isFullHeight
                              style={{ borderTop: `3px solid ${color}`, cursor: 'pointer' }}
                              onClick={() => navigate(`/canvas/${qs.slug}`)}
                            >
                              <CardHeader>
                                <CardTitle>
                                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                                    <FlexItem>
                                      <span style={{ fontSize: '1.5rem' }}>{template?.icon || icon}</span>
                                    </FlexItem>
                                    <FlexItem flex={{ default: 'flex_1' }}>
                                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{qs.projectName}</span>
                                    </FlexItem>
                                    <FlexItem>
                                      <Label color="green" isCompact>Deployed</Label>
                                    </FlexItem>
                                  </Flex>
                                </CardTitle>
                              </CardHeader>
                              <CardBody>
                                <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 10px' }}>
                                  Template: {qs.templateName}
                                </p>
                                <Flex gap={{ default: 'gapSm' }}>
                                  <FlexItem>
                                    <Label isCompact style={{ background: `${color}20`, color }}>{categoryLabels[qs.category]}</Label>
                                  </FlexItem>
                                  <FlexItem>
                                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                      {qs.nodeCount} nodes
                                    </span>
                                  </FlexItem>
                                </Flex>
                              </CardBody>
                              <CardFooter>
                                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                                  <FlexItem>
                                    <Button
                                      variant="link"
                                      isInline
                                      icon={<ExternalLinkAltIcon />}
                                      iconPosition="end"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/canvas/${qs.slug}`);
                                      }}
                                    >
                                      Open Canvas
                                    </Button>
                                  </FlexItem>
                                  {qs.timestamp && (
                                    <FlexItem>
                                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                        {new Date(qs.timestamp).toLocaleDateString()}
                                      </span>
                                    </FlexItem>
                                  )}
                                </Flex>
                              </CardFooter>
                            </Card>
                          </GalleryItem>
                        );
                      })}
                    </Gallery>
                  </FlexItem>
                )}
              </Flex>
            </Tab>
          </Tabs>
        </FlexItem>
      </Flex>
    </PageSection>
  );
};

export { QuickstartsPage };
