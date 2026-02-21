import * as React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Tabs,
  Tab,
  TabTitleText,
  Alert,
  AlertVariant,
  Flex,
  FlexItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from '@patternfly/react-icons';
import { NodeData, Connection, HelmGlobalValues } from '../types';
import {
  validateHelmWorkflow,
  generateChartYaml,
  generateValuesYaml,
  generateHelpersTemplate,
  ValidationResult,
} from '../utils/helmChartExporter';
import { generateHelmNodeYaml } from '../utils/helmYamlGenerator';
import Prism from 'prismjs';
import 'prismjs/components/prism-yaml';

interface HelmExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: NodeData[];
  connections: Connection[];
  globals: HelmGlobalValues;
  onExport: () => void;
}

export const HelmExportModal: React.FunctionComponent<HelmExportModalProps> = ({
  isOpen,
  onClose,
  nodes,
  connections,
  globals,
  onExport,
}) => {
  const [activeTab, setActiveTab] = React.useState<string | number>(0);
  const [validation, setValidation] = React.useState<ValidationResult | null>(null);

  // Validate on open
  React.useEffect(() => {
    if (isOpen) {
      const result = validateHelmWorkflow(nodes, connections, globals);
      setValidation(result);
    }
  }, [isOpen, nodes, connections, globals]);

  // Generate all YAML content
  const chartYaml = generateChartYaml(globals);
  const valuesYaml = generateValuesYaml(nodes, globals);
  const helpersTemplate = generateHelpersTemplate(globals);

  // Get individual template files
  const helmNodes = nodes.filter((node) => node.data?.helmConfig);
  const templateFiles = helmNodes.map((node) => ({
    name: `${node.data?.helmConfig?.resourceType}.yaml`,
    content: generateHelmNodeYaml(
      node.data?.helmConfig?.resourceType || '',
      node.data?.helmConfig?.values || {},
      globals
    ),
  }));

  // Syntax highlight YAML
  const highlightYaml = (yaml: string) => {
    return Prism.highlight(yaml, Prism.languages.yaml, 'yaml');
  };

  const renderYamlPreview = (yaml: string) => (
    <pre
      style={{
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        padding: '16px',
        borderRadius: '4px',
        overflow: 'auto',
        maxHeight: '500px',
        fontSize: '12px',
        lineHeight: '1.5',
        margin: 0,
      }}
    >
      <code dangerouslySetInnerHTML={{ __html: highlightYaml(yaml) }} />
    </pre>
  );

  return (
    <Modal
      variant={ModalVariant.large}
      title="Export Helm Chart"
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button
          key="export"
          variant="primary"
          onClick={onExport}
          isDisabled={!validation?.valid}
        >
          Export Chart
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>,
      ]}
    >
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
        {/* Validation Results */}
        {validation && (
          <FlexItem>
            {validation.valid ? (
              <Alert
                variant={AlertVariant.success}
                isInline
                title="Validation passed"
                icon={<CheckCircleIcon />}
              >
                Your Helm chart is ready to export. All required fields are configured and
                dependencies are properly connected.
              </Alert>
            ) : (
              <Alert
                variant={AlertVariant.danger}
                isInline
                title={`${validation.errors.length} validation error(s)`}
                icon={<ExclamationCircleIcon />}
              >
                <DescriptionList isCompact>
                  {validation.errors.map((error, index) => (
                    <DescriptionListGroup key={index}>
                      <DescriptionListTerm>{error.nodeName}</DescriptionListTerm>
                      <DescriptionListDescription>{error.message}</DescriptionListDescription>
                    </DescriptionListGroup>
                  ))}
                </DescriptionList>
              </Alert>
            )}
            {validation.warnings.length > 0 && (
              <Alert
                variant={AlertVariant.warning}
                isInline
                title={`${validation.warnings.length} warning(s)`}
                icon={<ExclamationTriangleIcon />}
                style={{ marginTop: '8px' }}
              >
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning.message}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </FlexItem>
        )}

        {/* Preview Tabs */}
        <FlexItem>
          <Tabs
            activeKey={activeTab}
            onSelect={(event, tabIndex) => setActiveTab(tabIndex)}
            aria-label="Helm chart files preview"
          >
            <Tab eventKey={0} title={<TabTitleText>Chart.yaml</TabTitleText>}>
              <div style={{ padding: '16px 0' }}>{renderYamlPreview(chartYaml)}</div>
            </Tab>
            <Tab eventKey={1} title={<TabTitleText>values.yaml</TabTitleText>}>
              <div style={{ padding: '16px 0' }}>{renderYamlPreview(valuesYaml)}</div>
            </Tab>
            <Tab eventKey={2} title={<TabTitleText>_helpers.tpl</TabTitleText>}>
              <div style={{ padding: '16px 0' }}>{renderYamlPreview(helpersTemplate)}</div>
            </Tab>
            {templateFiles.map((file, index) => (
              <Tab
                key={`template-${index}`}
                eventKey={3 + index}
                title={<TabTitleText>{file.name}</TabTitleText>}
              >
                <div style={{ padding: '16px 0' }}>{renderYamlPreview(file.content)}</div>
              </Tab>
            ))}
          </Tabs>
        </FlexItem>
      </Flex>
    </Modal>
  );
};
