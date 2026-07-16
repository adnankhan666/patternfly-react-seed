import * as React from 'react';
import {
  Modal,
  ModalVariant,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Button,
  Tabs,
  Tab,
  TabTitleText,
  Gallery,
  GalleryItem,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  TextInput,
  FormGroup,
  Label,
  Alert,
  Title,
} from '@patternfly/react-core';
import {
  RocketIcon,
  UploadIcon,
} from '@patternfly/react-icons';
import {
  BYOH_CHART_CATALOG,
  BYOHChartEntry,
  detectUriFormat,
  uriFormatColors,
  uriFormatLabels,
} from '../../../data/byohChartCatalog';
import { WorkflowTemplate } from '../../../data/workflowTemplates';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../constants';

interface HelmChartSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (nodes: any[], connections: any[], chartName: string) => void;
}

const createCustomTemplate = (chartName: string, sourceValue: string): WorkflowTemplate => ({
  id: `byoh-custom-${Date.now()}`,
  name: chartName,
  description: `Custom BYOH deployment`,
  category: 'helm-quickstart',
  icon: '\uD83D\uDCE6',
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
          values: { chartSource: sourceValue, sourceType: 'custom' },
        },
      },
    },
  ],
  connections: [],
});

const HelmChartSelector: React.FunctionComponent<HelmChartSelectorProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [activeTab, setActiveTab] = React.useState<string | number>(0);
  const [selectedChart, setSelectedChart] = React.useState<BYOHChartEntry | null>(null);
  const [uriValue, setUriValue] = React.useState('');
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [uriError, setUriError] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const uriFormat = detectUriFormat(uriValue);

  const reset = () => {
    setSelectedChart(null);
    setUriValue('');
    setUploadedFile(null);
    setUriError('');
    setActiveTab(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const buildNodesAndConnections = (template: WorkflowTemplate) => {
    const nodes = template.nodes.map((n, idx) => ({
      ...n,
      id: `${n.id}-${Date.now()}-${idx}`,
      size: { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
    }));
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
    return { nodes, connections };
  };

  const handleImportChart = () => {
    let template: WorkflowTemplate;
    let chartName: string;

    if (activeTab === 0 && selectedChart) {
      template = selectedChart;
      chartName = selectedChart.name;
    } else if (activeTab === 1 && uriValue.trim() && uriFormat !== 'unknown') {
      chartName = uriValue.split('/').pop() || 'custom-chart';
      template = createCustomTemplate(chartName, uriValue);
    } else if (activeTab === 2 && uploadedFile) {
      chartName = uploadedFile.name.replace(/\.tgz$/i, '');
      template = createCustomTemplate(chartName, uploadedFile.name);
    } else {
      return;
    }

    const { nodes, connections } = buildNodesAndConnections(template);
    onImport(nodes, connections, chartName);
    handleClose();
  };

  const canImport = (): boolean => {
    if (activeTab === 0) return selectedChart !== null;
    if (activeTab === 1) return uriValue.trim().length > 0 && uriFormat !== 'unknown';
    if (activeTab === 2) return uploadedFile !== null;
    return false;
  };

  const handleUriChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setUriValue(value);
    if (value.trim()) {
      const format = detectUriFormat(value);
      setUriError(format === 'unknown' ? 'Unrecognized URI format. Use oci://, https://, or a Git URL.' : '');
    } else {
      setUriError('');
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
  };

  return (
    <Modal
      variant={ModalVariant.large}
      isOpen={isOpen}
      onClose={handleClose}
    >
      <ModalHeader title="Import Helm Chart" description="Select a chart from the catalog, provide a URI, or upload a .tgz archive. Nodes will be added to the current canvas." />
      <ModalBody>
        <Tabs
          activeKey={activeTab}
          onSelect={(_e, tabIndex) => setActiveTab(tabIndex)}
          aria-label="Helm chart source tabs"
        >
          <Tab eventKey={0} title={<TabTitleText>Chart Catalog</TabTitleText>}>
            <div style={{ paddingTop: '16px' }}>
              <Gallery hasGutter minWidths={{ default: '260px' }}>
                {BYOH_CHART_CATALOG.map((chart) => (
                  <GalleryItem key={chart.id}>
                    <Card
                      isFullHeight
                      isSelectable
                      isSelected={selectedChart?.id === chart.id}
                      onClick={() => setSelectedChart(chart)}
                      style={{ cursor: 'pointer', borderTop: '3px solid #ec4899' }}
                    >
                      <CardHeader>
                        <CardTitle>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                            <FlexItem>
                              <span style={{ fontSize: '1.5rem' }}>{chart.icon || '\uD83D\uDCE6'}</span>
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
                        <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 8px' }}>
                          {chart.description}
                        </p>
                        <Label isCompact color="purple">{chart.nodes.length} resources</Label>
                      </CardBody>
                    </Card>
                  </GalleryItem>
                ))}
              </Gallery>
            </div>
          </Tab>

          <Tab eventKey={1} title={<TabTitleText>Custom URI</TabTitleText>}>
            <div style={{ paddingTop: '16px', maxWidth: '600px' }}>
              <FormGroup label="Helm chart URI" fieldId="helm-uri">
                <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <TextInput
                      id="helm-uri"
                      placeholder="oci://registry/chart, https://charts.example.com, or git URL"
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
            </div>
          </Tab>

          <Tab eventKey={2} title={<TabTitleText>Upload</TabTitleText>}>
            <div style={{ paddingTop: '16px' }}>
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
                <FlexItem>
                  <Title headingLevel="h4" size="md">Upload Chart Archive</Title>
                </FlexItem>
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
                    <Alert
                      variant="info"
                      isInline
                      isPlain
                      title={`Selected: ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)`}
                    />
                    <Button
                      variant="link"
                      onClick={() => {
                        setUploadedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      style={{ marginTop: '4px' }}
                    >
                      Clear selection
                    </Button>
                  </FlexItem>
                ) : (
                  <FlexItem>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                      Select a packaged Helm chart (.tgz) to import its resources onto the canvas.
                    </p>
                  </FlexItem>
                )}
              </Flex>
            </div>
          </Tab>
        </Tabs>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          icon={<RocketIcon />}
          onClick={handleImportChart}
          isDisabled={!canImport()}
        >
          Import to Canvas
        </Button>
        <Button variant="link" onClick={handleClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export { HelmChartSelector };
