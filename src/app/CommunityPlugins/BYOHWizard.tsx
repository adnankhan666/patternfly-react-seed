import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
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
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  MenuToggleElement,
  Spinner,
  Breadcrumb,
  BreadcrumbItem,
  ExpandableSection,
  Tabs,
  Tab,
  TabTitleText,
} from '@patternfly/react-core';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  RocketIcon,
  CheckCircleIcon,
  UploadIcon,
  OutlinedFolderOpenIcon,
  InProgressIcon,
} from '@patternfly/react-icons';
import {
  BYOH_CHART_CATALOG,
  BYOHChartEntry,
  BYOHDeploymentRecord,
  detectUriFormat,
  getBYOHDeployments,
  saveBYOHDeployment,
  uriFormatColors,
  uriFormatLabels,
} from '../../data/byohChartCatalog';
import { WorkflowTemplate } from '../../data/workflowTemplates';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../Canvas/constants';

type WizardStep = 'source' | 'configure' | 'review' | 'status';
type SourceMode = 'catalog' | 'byoh';
type SourceType = 'catalog' | 'uri' | 'upload';

const DEPLOY_STEPS = [
  'Validating chart',
  'Creating namespace',
  'Installing resources',
  'Health check',
  'Ready',
];

const NAMESPACE_OPTIONS = ['default', 'ml-workloads', 'data-science', 'custom'];

const slugify = (value: string): string =>
  value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'byoh-deployment';

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface NodeValueGroup {
  nodeLabel: string;
  nodeDescription: string;
  nodeColor: string;
  values: Record<string, string>;
}

const extractGroupedValues = (template: WorkflowTemplate | null): NodeValueGroup[] => {
  if (!template) return [];
  return template.nodes
    .filter((node) => node.data?.helmConfig?.values)
    .map((node) => {
      const values: Record<string, string> = {};
      Object.entries(node.data.helmConfig.values).forEach(([key, val]) => {
        if (typeof val === 'string' || typeof val === 'number') {
          values[key] = String(val);
        }
      });
      return {
        nodeLabel: node.label,
        nodeDescription: node.data?.description || '',
        nodeColor: node.data?.color || '#6b7280',
        values,
      };
    });
};

const flattenGroupedValues = (groups: NodeValueGroup[]): Record<string, string> => {
  const flat: Record<string, string> = {};
  groups.forEach((g) => {
    Object.entries(g.values).forEach(([key, val]) => {
      flat[`${g.nodeLabel}.${key}`] = val;
    });
  });
  return flat;
};

const computeResourceEstimate = (template: WorkflowTemplate | null) => {
  let cpu = 0;
  let memoryGi = 0;
  let gpu = 0;

  template?.nodes.forEach((node) => {
    const v = node.data?.helmConfig?.values;
    if (!v) return;
    cpu += parseInt(v.cpuLimit || v.cpuRequest || '0', 10) || 0;
    const mem = v.memoryLimit || v.memoryRequest || '0';
    memoryGi += parseInt(String(mem).replace(/Gi/i, ''), 10) || 0;
    gpu += parseInt(v.gpuLimit || v.gpuRequest || '0', 10) || 0;
  });

  return { cpu: cpu || 2, memoryGi: memoryGi || 4, gpu };
};

const createCustomBYOHTemplate = (chartName: string, sourceType: SourceType, sourceValue: string): WorkflowTemplate => ({
  id: `byoh-custom-${Date.now()}`,
  name: chartName,
  description: `Custom BYOH deployment from ${sourceType}`,
  category: 'helm-quickstart',
  icon: '📦',
  nodes: [
    {
      id: 'node-helm-deploy',
      type: 'model-serving',
      label: 'Helm Deploy',
      position: { x: 250, y: 200 },
      data: {
        color: '#ec4899',
        description: `Deploy ${chartName}`,
        helmConfig: {
          resourceType: 'helm-release',
          values: {
            chartSource: sourceValue,
            sourceType,
          },
        },
      },
    },
  ],
  connections: [],
});

const BYOHWizard: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<WizardStep>('source');
  const [sourceMode, setSourceMode] = React.useState<SourceMode>('catalog');
  const [selectedChart, setSelectedChart] = React.useState<BYOHChartEntry | null>(null);
  const [uriValue, setUriValue] = React.useState('');
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [releaseName, setReleaseName] = React.useState('');
  const [namespace, setNamespace] = React.useState('ml-workloads');
  const [customNamespace, setCustomNamespace] = React.useState('');
  const [valuesOverrides, setValuesOverrides] = React.useState<Record<string, string>>({});
  const [nodeGroups, setNodeGroups] = React.useState<NodeValueGroup[]>([]);
  const [deployStepIndex, setDeployStepIndex] = React.useState(-1);
  const [deploymentComplete, setDeploymentComplete] = React.useState(false);
  const [deploymentHistory, setDeploymentHistory] = React.useState<BYOHDeploymentRecord[]>([]);
  const [isNamespaceOpen, setIsNamespaceOpen] = React.useState(false);
  const [uriError, setUriError] = React.useState('');
  const [resourceViewMode, setResourceViewMode] = React.useState<'accordion' | 'tabs'>('accordion');
  const [expandedResources, setExpandedResources] = React.useState<Set<string>>(new Set());
  const [activeResourceTab, setActiveResourceTab] = React.useState<string | number>(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setDeploymentHistory(getBYOHDeployments());
  }, []);

  const resolvedNamespace = namespace === 'custom' ? customNamespace : namespace;
  const uriFormat = detectUriFormat(uriValue);

  const getSourceType = (): SourceType => {
    if (sourceMode === 'catalog') return 'catalog';
    if (uploadedFile) return 'upload';
    return 'uri';
  };

  const getChartName = (): string => {
    if (selectedChart) return selectedChart.name;
    if (uploadedFile) return uploadedFile.name.replace(/\.tgz$/i, '');
    if (uriValue) return uriValue.split('/').pop() || 'custom-chart';
    return 'custom-chart';
  };

  const getSourceValue = (): string => {
    if (selectedChart) return selectedChart.id;
    if (uploadedFile) return uploadedFile.name;
    return uriValue;
  };

  const canProceedFromSource = (): boolean => {
    if (sourceMode === 'catalog') return selectedChart !== null;
    if (uploadedFile) return true;
    if (uriValue.trim()) return uriFormat !== 'unknown';
    return false;
  };

  const canProceedFromConfigure = (): boolean =>
    releaseName.trim().length > 0 && (namespace !== 'custom' || customNamespace.trim().length > 0);

  const handleSelectChart = (chart: BYOHChartEntry) => {
    setSelectedChart(chart);
    setReleaseName(slugify(chart.name));
    const groups = extractGroupedValues(chart);
    setNodeGroups(groups);
    setValuesOverrides(flattenGroupedValues(groups));
    setExpandedResources(new Set(groups.map((g) => g.nodeLabel)));
    setActiveResourceTab(0);
    setSourceMode('catalog');
    setUriValue('');
    setUploadedFile(null);
    setUriError('');
  };

  const handleSourceModeChange = (mode: SourceMode) => {
    setSourceMode(mode);
    if (mode === 'catalog') {
      setUriValue('');
      setUploadedFile(null);
      setUriError('');
    } else {
      setSelectedChart(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.tgz')) {
      setUriError('Only .tgz Helm chart archives are accepted');
      return;
    }
    setUploadedFile(file);
    setUriError('');
    setReleaseName(slugify(file.name.replace(/\.tgz$/i, '')));
    setValuesOverrides({});
    setSourceMode('byoh');
    setSelectedChart(null);
  };

  const handleUriChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setUriValue(value);
    setUploadedFile(null);
    setSelectedChart(null);
    setSourceMode('byoh');
    if (value.trim()) {
      const format = detectUriFormat(value);
      if (format === 'unknown') {
        setUriError('Unrecognized URI format. Use oci://, https://, or a Git URL.');
      } else {
        setUriError('');
        setReleaseName(slugify(value.split('/').pop() || 'custom-chart'));
      }
    } else {
      setUriError('');
    }
    setValuesOverrides({});
  };

  const handleProceedToConfigure = () => {
    if (!canProceedFromSource()) return;
    if (sourceMode === 'byoh' && !uploadedFile && uriValue && uriFormat === 'unknown') return;
    setStep('configure');
  };

  const handleValueChange = (key: string, value: string) => {
    setValuesOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const handleGroupedValueChange = (nodeLabel: string, key: string, value: string) => {
    setNodeGroups((prev) =>
      prev.map((g) =>
        g.nodeLabel === nodeLabel ? { ...g, values: { ...g.values, [key]: value } } : g
      )
    );
    setValuesOverrides((prev) => ({ ...prev, [`${nodeLabel}.${key}`]: value }));
  };

  const createProjectAndLoadTemplate = (): string => {
    const slug = slugify(releaseName);
    const existingProjects = JSON.parse(localStorage.getItem('canvasProjects') || '[]');
    const displayName = releaseName || 'BYOH Deployment';
    if (!existingProjects.includes(displayName)) {
      existingProjects.push(displayName);
      localStorage.setItem('canvasProjects', JSON.stringify(existingProjects));
    }

    let template: WorkflowTemplate;
    if (selectedChart) {
      template = selectedChart;
    } else {
      template = createCustomBYOHTemplate(getChartName(), getSourceType(), getSourceValue());
    }

    const now = new Date().toISOString();
    const overridesByLabel = new Map(nodeGroups.map((group) => [group.nodeLabel, group.values]));
    const nodes = template.nodes.map((n, idx) => {
      const overrides = overridesByLabel.get(n.label);
      const baseNode = {
        ...n,
        id: `${n.id}-${Date.now()}-${idx}`,
        size: { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
      };

      if (!overrides || !baseNode.data?.helmConfig) {
        return baseNode;
      }

      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          helmConfig: {
            ...baseNode.data.helmConfig,
            values: {
              ...baseNode.data.helmConfig.values,
              ...overrides,
            },
          },
        },
      };
    });
    const idMap = new Map<string, string>();
    template.nodes.forEach((orig, idx) => {
      idMap.set(orig.id, nodes[idx].id);
    });
    const connections = template.connections.map((c, idx) => ({
      ...c,
      id: `conn-${Date.now()}-${idx}`,
      source: idMap.get(c.source) || c.source,
      target: idMap.get(c.target) || c.target,
    }));

    const workflowData = {
      projectName: displayName,
      nodes,
      connections,
      timestamp: now,
      templateId: template.id,
      byohDeployment: {
        releaseName,
        namespace: resolvedNamespace,
        sourceType: getSourceType(),
        sourceValue: getSourceValue(),
        valuesOverrides,
      },
    };
    localStorage.setItem(`workflow-${displayName}`, JSON.stringify(workflowData));
    window.dispatchEvent(new Event('projectsUpdated'));
    return slug;
  };

  const runDeploySimulation = () => {
    setStep('status');
    setDeployStepIndex(0);
    setDeploymentComplete(false);

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current < DEPLOY_STEPS.length) {
        setDeployStepIndex(current);
      } else {
        clearInterval(interval);
        setDeploymentComplete(true);

        const record: BYOHDeploymentRecord = {
          releaseName,
          namespace: resolvedNamespace,
          chartName: getChartName(),
          sourceType: getSourceType(),
          sourceValue: getSourceValue(),
          templateId: selectedChart?.id,
          timestamp: new Date().toISOString(),
          status: 'deployed',
        };
        saveBYOHDeployment(record);
        createProjectAndLoadTemplate();
        setDeploymentHistory(getBYOHDeployments());
      }
    }, 800);
  };

  const handleViewInCanvas = () => {
    const slug = slugify(releaseName);
    navigate(`/canvas/${slug}`);
  };

  const handleDeployAnother = () => {
    setStep('source');
    setSourceMode('catalog');
    setSelectedChart(null);
    setUriValue('');
    setUploadedFile(null);
    setReleaseName('');
    setNamespace('ml-workloads');
    setCustomNamespace('');
    setValuesOverrides({});
    setNodeGroups([]);
    setDeployStepIndex(-1);
    setDeploymentComplete(false);
    setUriError('');
  };

  const handleHistoryClick = (record: BYOHDeploymentRecord) => {
    navigate(`/canvas/${slugify(record.releaseName)}`);
  };

  const activeTemplate = selectedChart;
  const resourceEstimate = computeResourceEstimate(activeTemplate);

  const renderStepIndicator = () => (
    <Flex gap={{ default: 'gapMd' }} style={{ marginTop: '12px', marginLeft: '48px', flexWrap: 'wrap' }}>
      {(['source', 'configure', 'review', 'status'] as WizardStep[]).map((s, idx) => {
        const labels = ['1. Source', '2. Configure', '3. Review', '4. Status'];
        const stepOrder = ['source', 'configure', 'review', 'status'];
        const currentIdx = stepOrder.indexOf(step);
        const isActive = s === step;
        const isDone = currentIdx > idx;
        return (
          <React.Fragment key={s}>
            {idx > 0 && <FlexItem><ArrowRightIcon style={{ color: '#d1d5db' }} /></FlexItem>}
            <FlexItem>
              <Label color={isActive ? 'blue' : isDone ? 'green' : 'grey'} isCompact>
                {labels[idx]}
              </Label>
            </FlexItem>
          </React.Fragment>
        );
      })}
    </Flex>
  );

  return (
    <PageSection hasBodyWrapper={false}>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }} style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header with breadcrumb */}
        <FlexItem>
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to="/plugins">Plugins</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to="/plugins/lemonade">Lemonade</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>BYOH Deploy</BreadcrumbItem>
          </Breadcrumb>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }} style={{ marginTop: '12px' }}>
            <FlexItem>
              <Button
                variant="plain"
                icon={<ArrowLeftIcon />}
                onClick={() => {
                  if (step === 'configure') setStep('source');
                  else if (step === 'review') setStep('configure');
                  else if (step === 'status' && !deploymentComplete) setStep('review');
                  else navigate('/plugins/lemonade');
                }}
                aria-label="Go back"
              />
            </FlexItem>
            <FlexItem>
              <Title headingLevel="h1" size="2xl">
                <RocketIcon style={{ marginRight: '8px', color: '#ec4899' }} />
                BYOH — Bring Your Own Helm
              </Title>
            </FlexItem>
          </Flex>
          {renderStepIndicator()}
        </FlexItem>

        <Divider />

        {/* Deployment History */}
        {step === 'source' && deploymentHistory.length > 0 && (
          <FlexItem>
            <Card isCompact>
              <CardBody>
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
                  <FlexItem>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Recent Deployments</span>
                  </FlexItem>
                  <FlexItem>
                    <Flex gap={{ default: 'gapSm' }} style={{ flexWrap: 'wrap' }}>
                      {deploymentHistory.slice(0, 5).map((record) => (
                        <FlexItem key={record.releaseName}>
                          <Button
                            variant="plain"
                            onClick={() => handleHistoryClick(record)}
                            style={{
                              border: '1px solid #d1d5db',
                              borderRadius: '16px',
                              padding: '4px 12px',
                              fontSize: '0.8rem',
                            }}
                          >
                            {record.releaseName}
                            <span style={{ color: '#9ca3af', marginLeft: '6px' }}>
                              {new Date(record.timestamp).toLocaleDateString()}
                            </span>
                          </Button>
                        </FlexItem>
                      ))}
                    </Flex>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </FlexItem>
        )}

        {/* Step 1: Source */}
        {step === 'source' && (
          <FlexItem>
            <Content style={{ marginBottom: '16px' }}>
              <p style={{ color: '#6b7280' }}>
                Choose a recommended Helm chart from our catalog, or bring your own via URI or file upload.
              </p>
            </Content>

            <Flex gap={{ default: 'gapSm' }} style={{ marginBottom: '20px' }}>
              <FlexItem>
                <Button
                  variant={sourceMode === 'catalog' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleSourceModeChange('catalog')}
                >
                  Recommended Charts
                </Button>
              </FlexItem>
              <FlexItem>
                <Button
                  variant={sourceMode === 'byoh' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleSourceModeChange('byoh')}
                >
                  Bring Your Own
                </Button>
              </FlexItem>
            </Flex>

            {sourceMode === 'catalog' && (
              <Gallery hasGutter minWidths={{ default: '280px' }}>
                {BYOH_CHART_CATALOG.map((chart) => (
                  <GalleryItem key={chart.id}>
                    <Card
                      isFullHeight
                      isSelectable
                      isSelected={selectedChart?.id === chart.id}
                      onClick={() => handleSelectChart(chart)}
                      style={{ cursor: 'pointer', borderTop: '3px solid #ec4899' }}
                    >
                      <CardHeader>
                        <CardTitle>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                            <FlexItem>
                              <span style={{ fontSize: '2rem' }}>{chart.icon || '📦'}</span>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <span style={{ fontWeight: 600 }}>{chart.name}</span>
                            </FlexItem>
                            {chart.popular && (
                              <FlexItem>
                                <Label color="blue" isCompact>Popular</Label>
                              </FlexItem>
                            )}
                          </Flex>
                        </CardTitle>
                      </CardHeader>
                      <CardBody>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 12px' }}>
                          {chart.description}
                        </p>
                        <Flex gap={{ default: 'gapSm' }} style={{ flexWrap: 'wrap' }}>
                          <Label isCompact color="purple">
                            {chart.nodes.length} resources
                          </Label>
                          {chart.chartRepo && (
                            <Label isCompact color="grey">Helm Chart</Label>
                          )}
                        </Flex>
                      </CardBody>
                    </Card>
                  </GalleryItem>
                ))}
              </Gallery>
            )}

            {sourceMode === 'byoh' && (
              <Flex gap={{ default: 'gapLg' }} direction={{ default: 'column' }}>
                <FlexItem>
                  <Card>
                    <CardTitle>Chart URI</CardTitle>
                    <CardBody>
                      <FormGroup label="Helm chart URI" fieldId="byoh-uri">
                        <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem flex={{ default: 'flex_1' }}>
                            <TextInput
                              id="byoh-uri"
                              placeholder="oci://registry/chart, https://charts.example.com, or https://github.com/org/repo"
                              value={uriValue}
                              onChange={handleUriChange}
                            />
                          </FlexItem>
                          {uriValue.trim() && (
                            <FlexItem>
                              <Label color={uriFormatColors[uriFormat] as 'blue'} isCompact>
                                {uriFormatLabels[uriFormat]}
                              </Label>
                            </FlexItem>
                          )}
                        </Flex>
                        {uriError && (
                          <Alert variant="warning" isInline isPlain title={uriError} style={{ marginTop: '8px' }} />
                        )}
                      </FormGroup>
                    </CardBody>
                  </Card>
                </FlexItem>

                <FlexItem style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                  — or —
                </FlexItem>

                <FlexItem>
                  <Card>
                    <CardTitle>Upload Chart Archive</CardTitle>
                    <CardBody>
                      <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
                        <FlexItem>
                          <Button variant="secondary" icon={<UploadIcon />} onClick={() => fileInputRef.current?.click()}>
                            Browse for .tgz chart
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".tgz"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                          />
                        </FlexItem>
                        {uploadedFile ? (
                          <FlexItem>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                              Selected: <strong>{uploadedFile.name}</strong> ({formatFileSize(uploadedFile.size)})
                            </p>
                            <Button
                              variant="link"
                              onClick={() => {
                                setUploadedFile(null);
                                setUriError('');
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                            >
                              Clear selection
                            </Button>
                          </FlexItem>
                        ) : (
                          <FlexItem>
                            <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                              Drag and drop is not required — click Browse to select a packaged Helm chart (.tgz).
                            </p>
                          </FlexItem>
                        )}
                      </Flex>
                    </CardBody>
                  </Card>
                </FlexItem>
              </Flex>
            )}

            <Flex gap={{ default: 'gapMd' }} style={{ marginTop: '24px' }}>
              <FlexItem>
                <Button
                  variant="primary"
                  icon={<ArrowRightIcon />}
                  iconPosition="end"
                  onClick={handleProceedToConfigure}
                  isDisabled={!canProceedFromSource()}
                >
                  Continue to Configure
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        )}

        {/* Step 2: Configure */}
        {step === 'configure' && (
          <FlexItem>
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
              {/* Resource estimate banner */}
              <FlexItem>
                <Card isCompact style={{ background: 'var(--pf-t--global--background--color--secondary--default, #f0f0f0)', boxShadow: 'none' }}>
                  <CardBody>
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} style={{ flexWrap: 'wrap', gap: '12px' }}>
                      <FlexItem>
                        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                          <FlexItem><span style={{ fontSize: '1.5rem' }}>{selectedChart?.icon || '📦'}</span></FlexItem>
                          <FlexItem>
                            <strong>{getChartName()}</strong>
                            <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                              <Label isCompact color="purple">{getSourceType()}</Label>
                            </span>
                          </FlexItem>
                        </Flex>
                      </FlexItem>
                      <FlexItem>
                        <Flex gap={{ default: 'gapLg' }} alignItems={{ default: 'alignItemsCenter' }}>
                          {activeTemplate && (
                            <>
                              <FlexItem>
                                <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>RESOURCES</span>
                                <div style={{ fontWeight: 600 }}>{activeTemplate.nodes.length} K8s</div>
                              </FlexItem>
                              <FlexItem>
                                <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>CPU</span>
                                <div style={{ fontWeight: 600 }}>{resourceEstimate.cpu} cores</div>
                              </FlexItem>
                              <FlexItem>
                                <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>MEMORY</span>
                                <div style={{ fontWeight: 600 }}>{resourceEstimate.memoryGi} Gi</div>
                              </FlexItem>
                              {resourceEstimate.gpu > 0 && (
                                <FlexItem>
                                  <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>GPU</span>
                                  <div style={{ fontWeight: 600 }}>{resourceEstimate.gpu}</div>
                                </FlexItem>
                              )}
                            </>
                          )}
                        </Flex>
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              </FlexItem>

              {/* Release + Namespace row */}
              <FlexItem>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Card isCompact>
                    <CardBody>
                      <FormGroup label="Release Name" isRequired fieldId="byoh-release-name">
                        <TextInput
                          isRequired
                          id="byoh-release-name"
                          value={releaseName}
                          onChange={(_e, val) => setReleaseName(val)}
                        />
                      </FormGroup>
                    </CardBody>
                  </Card>
                  <Card isCompact>
                    <CardBody>
                      <FormGroup label="Namespace" fieldId="byoh-namespace">
                        <Select
                          selected={namespace}
                          onSelect={(_event, selection) => {
                            setNamespace(String(selection));
                            setIsNamespaceOpen(false);
                          }}
                          onOpenChange={(isOpen) => setIsNamespaceOpen(isOpen)}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle ref={toggleRef} onClick={() => setIsNamespaceOpen(!isNamespaceOpen)} isExpanded={isNamespaceOpen}>
                              {namespace === 'custom' ? 'Custom' : namespace}
                            </MenuToggle>
                          )}
                          isOpen={isNamespaceOpen}
                        >
                          <SelectList>
                            {NAMESPACE_OPTIONS.map((ns) => (
                              <SelectOption key={ns} value={ns}>
                                {ns === 'custom' ? 'Custom namespace...' : ns}
                              </SelectOption>
                            ))}
                          </SelectList>
                        </Select>
                        {namespace === 'custom' && (
                          <TextInput
                            id="byoh-custom-namespace"
                            placeholder="Enter custom namespace"
                            value={customNamespace}
                            onChange={(_e, val) => setCustomNamespace(val)}
                            style={{ marginTop: '8px' }}
                          />
                        )}
                      </FormGroup>
                    </CardBody>
                  </Card>
                </div>
              </FlexItem>

              {/* Node-grouped value overrides */}
              {nodeGroups.length > 0 ? (
                <>
                  <FlexItem>
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <FlexItem>
                        <Title headingLevel="h3" size="md">
                          Resources ({nodeGroups.length})
                        </Title>
                      </FlexItem>
                      <FlexItem>
                        <Flex gap={{ default: 'gapXs' }}>
                          <FlexItem>
                            <Button
                              variant={resourceViewMode === 'accordion' ? 'primary' : 'secondary'}
                              size="sm"
                              onClick={() => setResourceViewMode('accordion')}
                            >
                              Accordion
                            </Button>
                          </FlexItem>
                          <FlexItem>
                            <Button
                              variant={resourceViewMode === 'tabs' ? 'primary' : 'secondary'}
                              size="sm"
                              onClick={() => setResourceViewMode('tabs')}
                            >
                              Tabs
                            </Button>
                          </FlexItem>
                        </Flex>
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  {resourceViewMode === 'accordion' ? (
                    <FlexItem>
                      <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
                        {nodeGroups.map((group) => {
                          const isExpanded = expandedResources.has(group.nodeLabel);
                          const fieldCount = Object.keys(group.values).length;
                          return (
                            <FlexItem key={group.nodeLabel}>
                              <Card isCompact>
                                <ExpandableSection
                                  toggleContent={
                                    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                                      <FlexItem>
                                        <span style={{
                                          display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
                                          background: group.nodeColor, flexShrink: 0,
                                        }} />
                                      </FlexItem>
                                      <FlexItem>
                                        <strong>{group.nodeLabel}</strong>
                                      </FlexItem>
                                      <FlexItem>
                                        <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                                          {group.nodeDescription}
                                        </span>
                                      </FlexItem>
                                      <FlexItem>
                                        <Label isCompact color="grey">{fieldCount} fields</Label>
                                      </FlexItem>
                                    </Flex>
                                  }
                                  isExpanded={isExpanded}
                                  onToggle={(_e, expanded) => {
                                    setExpandedResources((prev) => {
                                      const next = new Set(prev);
                                      if (expanded) next.add(group.nodeLabel);
                                      else next.delete(group.nodeLabel);
                                      return next;
                                    });
                                  }}
                                >
                                  <CardBody>
                                    <div style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(2, 1fr)',
                                      gap: '12px',
                                    }}>
                                      {Object.entries(group.values).map(([key, val]) => (
                                        <FormGroup key={key} label={key} fieldId={`val-${group.nodeLabel}-${key}`}>
                                          <TextInput
                                            id={`val-${group.nodeLabel}-${key}`}
                                            value={val}
                                            onChange={(_e, v) => handleGroupedValueChange(group.nodeLabel, key, v)}
                                          />
                                        </FormGroup>
                                      ))}
                                    </div>
                                  </CardBody>
                                </ExpandableSection>
                              </Card>
                            </FlexItem>
                          );
                        })}
                        <FlexItem>
                          <Flex gap={{ default: 'gapSm' }}>
                            <FlexItem>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => setExpandedResources(new Set(nodeGroups.map((g) => g.nodeLabel)))}
                              >
                                Expand all
                              </Button>
                            </FlexItem>
                            <FlexItem>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => setExpandedResources(new Set())}
                              >
                                Collapse all
                              </Button>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  ) : (
                    <FlexItem>
                      <Card isCompact>
                        <Tabs
                          activeKey={activeResourceTab}
                          onSelect={(_e, tabIndex) => setActiveResourceTab(tabIndex)}
                          aria-label="Resource configuration tabs"
                        >
                          {nodeGroups.map((group, index) => (
                            <Tab
                              key={group.nodeLabel}
                              eventKey={index}
                              title={
                                <TabTitleText>
                                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapXs' }}>
                                    <FlexItem>
                                      <span style={{
                                        display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                                        background: group.nodeColor,
                                      }} />
                                    </FlexItem>
                                    <FlexItem>{group.nodeLabel}</FlexItem>
                                  </Flex>
                                </TabTitleText>
                              }
                            >
                              <CardBody>
                                <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
                                  {group.nodeDescription && (
                                    <FlexItem>
                                      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                                        {group.nodeDescription}
                                      </p>
                                    </FlexItem>
                                  )}
                                  <FlexItem>
                                    <div style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(2, 1fr)',
                                      gap: '12px',
                                    }}>
                                      {Object.entries(group.values).map(([key, val]) => (
                                        <FormGroup key={key} label={key} fieldId={`val-${group.nodeLabel}-${key}`}>
                                          <TextInput
                                            id={`val-${group.nodeLabel}-${key}`}
                                            value={val}
                                            onChange={(_e, v) => handleGroupedValueChange(group.nodeLabel, key, v)}
                                          />
                                        </FormGroup>
                                      ))}
                                    </div>
                                  </FlexItem>
                                </Flex>
                              </CardBody>
                            </Tab>
                          ))}
                        </Tabs>
                      </Card>
                    </FlexItem>
                  )}
                </>
              ) : (
                <FlexItem>
                  <Card isCompact>
                    <CardHeader><CardTitle>Values Overrides</CardTitle></CardHeader>
                    <CardBody>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <FormGroup label="replicas" fieldId="byoh-replicas">
                          <TextInput
                            id="byoh-replicas"
                            value={valuesOverrides.replicas || '1'}
                            onChange={(_e, v) => handleValueChange('replicas', v)}
                          />
                        </FormGroup>
                        <FormGroup label="image.tag" fieldId="byoh-image-tag">
                          <TextInput
                            id="byoh-image-tag"
                            value={valuesOverrides['image.tag'] || 'latest'}
                            onChange={(_e, v) => handleValueChange('image.tag', v)}
                          />
                        </FormGroup>
                      </div>
                    </CardBody>
                  </Card>
                </FlexItem>
              )}

              {/* Actions */}
              <FlexItem>
                <Flex gap={{ default: 'gapMd' }}>
                  <FlexItem>
                    <Button
                      variant="primary"
                      icon={<ArrowRightIcon />}
                      iconPosition="end"
                      onClick={() => setStep('review')}
                      isDisabled={!canProceedFromConfigure()}
                    >
                      Review Deployment
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button variant="link" onClick={() => setStep('source')}>
                      Back to Source
                    </Button>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>
          </FlexItem>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <FlexItem>
            <Card style={{ borderTop: '3px solid #ec4899' }}>
              <CardBody>
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
                  <FlexItem>
                    <Title headingLevel="h2" size="xl">Review Deployment</Title>
                    <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
                      Confirm your deployment settings before proceeding.
                    </p>
                  </FlexItem>

                  <Divider />

                  <FlexItem>
                    <DescriptionList isHorizontal>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Chart</DescriptionListTerm>
                        <DescriptionListDescription>{getChartName()}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Source Type</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Label isCompact color="purple">{getSourceType()}</Label>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Source</DescriptionListTerm>
                        <DescriptionListDescription style={{ wordBreak: 'break-all' }}>
                          {getSourceValue()}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Release Name</DescriptionListTerm>
                        <DescriptionListDescription>{releaseName}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Namespace</DescriptionListTerm>
                        <DescriptionListDescription>{resolvedNamespace}</DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </FlexItem>

                  {Object.keys(valuesOverrides).length > 0 && (
                    <FlexItem>
                      <Title headingLevel="h3" size="md">Values Overrides</Title>
                      <DescriptionList isHorizontal style={{ marginTop: '8px' }}>
                        {Object.entries(valuesOverrides).map(([key, val]) => (
                          <DescriptionListGroup key={key}>
                            <DescriptionListTerm>{key}</DescriptionListTerm>
                            <DescriptionListDescription>{val}</DescriptionListDescription>
                          </DescriptionListGroup>
                        ))}
                      </DescriptionList>
                    </FlexItem>
                  )}

                  <FlexItem>
                    <Card isCompact>
                      <CardTitle>Resource Estimate</CardTitle>
                      <CardBody>
                        <Flex gap={{ default: 'gapLg' }}>
                          <FlexItem><Label isCompact>CPU: {resourceEstimate.cpu} cores</Label></FlexItem>
                          <FlexItem><Label isCompact>Memory: {resourceEstimate.memoryGi} Gi</Label></FlexItem>
                          {resourceEstimate.gpu > 0 && (
                            <FlexItem><Label isCompact>GPU: {resourceEstimate.gpu}</Label></FlexItem>
                          )}
                        </Flex>
                      </CardBody>
                    </Card>
                  </FlexItem>

                  <Divider />

                  <FlexItem>
                    <Flex gap={{ default: 'gapMd' }}>
                      <FlexItem>
                        <Button variant="primary" icon={<RocketIcon />} onClick={runDeploySimulation}>
                          Deploy
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button variant="link" onClick={() => setStep('configure')}>
                          Edit Configuration
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button variant="link" onClick={() => setStep('source')}>
                          Change Source
                        </Button>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </FlexItem>
        )}

        {/* Step 4: Status */}
        {step === 'status' && (
          <FlexItem>
            <Card>
              <CardBody>
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }} style={{ padding: deploymentComplete ? '2rem' : '3rem' }}>
                  {!deploymentComplete && (
                    <>
                      <FlexItem style={{ textAlign: 'center' }}>
                        <Spinner size="xl" aria-label="Deploying" />
                      </FlexItem>
                      <FlexItem>
                        <Title headingLevel="h2" size="xl" style={{ textAlign: 'center' }}>
                          Deploying {releaseName}...
                        </Title>
                      </FlexItem>
                      <FlexItem>
                        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} style={{ maxWidth: '400px', margin: '0 auto' }}>
                          {DEPLOY_STEPS.map((deployStep, idx) => {
                            const isDone = idx < deployStepIndex;
                            const isCurrent = idx === deployStepIndex;
                            return (
                              <FlexItem key={deployStep}>
                                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                                  <FlexItem>
                                    {isDone ? (
                                      <CheckCircleIcon style={{ color: '#16a34a', fontSize: '1.25rem' }} />
                                    ) : isCurrent ? (
                                      <InProgressIcon style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
                                    ) : (
                                      <span style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #d1d5db', display: 'inline-block' }} />
                                    )}
                                  </FlexItem>
                                  <FlexItem>
                                    <span style={{ color: isDone ? '#16a34a' : isCurrent ? '#1f2937' : '#9ca3af', fontWeight: isCurrent ? 600 : 400 }}>
                                      {deployStep}
                                    </span>
                                  </FlexItem>
                                </Flex>
                              </FlexItem>
                            );
                          })}
                        </Flex>
                      </FlexItem>
                    </>
                  )}

                  {deploymentComplete && (
                    <>
                      <FlexItem style={{ textAlign: 'center' }}>
                        <CheckCircleIcon style={{ fontSize: '4rem', color: '#16a34a' }} />
                      </FlexItem>
                      <FlexItem style={{ textAlign: 'center' }}>
                        <Title headingLevel="h2" size="xl">Deployment Successful</Title>
                        <p style={{ color: '#6b7280', marginTop: '8px' }}>
                          <strong>{releaseName}</strong> has been deployed to namespace <strong>{resolvedNamespace}</strong>
                        </p>
                      </FlexItem>

                      <FlexItem>
                        <Card isCompact>
                          <CardBody>
                            <DescriptionList isHorizontal>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Chart</DescriptionListTerm>
                                <DescriptionListDescription>{getChartName()}</DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Release</DescriptionListTerm>
                                <DescriptionListDescription>{releaseName}</DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Namespace</DescriptionListTerm>
                                <DescriptionListDescription>{resolvedNamespace}</DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Status</DescriptionListTerm>
                                <DescriptionListDescription>
                                  <Label color="green">Deployed</Label>
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            </DescriptionList>
                          </CardBody>
                        </Card>
                      </FlexItem>

                      <FlexItem>
                        <Alert variant="success" isInline title="Your Helm chart has been deployed. View the resources in Canvas or deploy another chart." />
                      </FlexItem>

                      <FlexItem>
                        <Flex gap={{ default: 'gapMd' }} justifyContent={{ default: 'justifyContentCenter' }}>
                          <FlexItem>
                            <Button variant="primary" icon={<OutlinedFolderOpenIcon />} onClick={handleViewInCanvas}>
                              View in Canvas
                            </Button>
                          </FlexItem>
                          <FlexItem>
                            <Button variant="secondary" icon={<UploadIcon />} onClick={handleDeployAnother}>
                              Deploy Another
                            </Button>
                          </FlexItem>
                        </Flex>
                      </FlexItem>
                    </>
                  )}
                </Flex>
              </CardBody>
            </Card>
          </FlexItem>
        )}
      </Flex>
    </PageSection>
  );
};

export { BYOHWizard };
