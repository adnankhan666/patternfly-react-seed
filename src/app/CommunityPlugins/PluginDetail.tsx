import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Flex,
  FlexItem,
  Content,
  Button,
  Label,
  Divider,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  Modal,
  ModalVariant,
  ModalBody,
  ModalFooter,
  ModalHeader,
  FormGroup,
  TextInput,
  Progress,
  ProgressMeasureLocation,
  Alert,
  Spinner,
} from '@patternfly/react-core';
import {
  DownloadIcon,
  TrashIcon,
  CheckCircleIcon,
  ExternalLinkAltIcon,
} from '@patternfly/react-icons';
import { getPluginById, PLUGIN_CATEGORIES, getPluginWorkspacePath, getDeployedPluginIds, setDeployedPluginIds } from '../../data/pluginRegistry';
import { CommunityPluginsBreadcrumb } from './CommunityPluginsBreadcrumb';

type WizardStep = 'configure' | 'deploying' | 'done';

const DEPLOY_PHASES = [
  'Validating plugin compatibility...',
  'Pulling plugin image...',
  'Configuring namespace resources...',
  'Applying RBAC policies...',
  'Deploying plugin operator...',
  'Running health checks...',
  'Finalizing deployment...',
];

const PluginDetail: React.FunctionComponent = () => {
  const { pluginId } = useParams<{ pluginId: string }>();
  const navigate = useNavigate();
  const plugin = pluginId ? getPluginById(pluginId) : undefined;

  const [deployed, setDeployed] = React.useState(() => {
    return pluginId ? getDeployedPluginIds().includes(pluginId) : false;
  });

  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [wizardStep, setWizardStep] = React.useState<WizardStep>('configure');
  const [namespace, setNamespace] = React.useState('default');
  const [deployProgress, setDeployProgress] = React.useState(0);
  const [deployPhase, setDeployPhase] = React.useState('');

  React.useEffect(() => {
    localStorage.setItem('visitedPlugins', 'true');
  }, []);

  const startDeployWizard = () => {
    setWizardStep('configure');
    setNamespace('default');
    setDeployProgress(0);
    setDeployPhase('');
    setWizardOpen(true);
  };

  const runDeploy = React.useCallback(() => {
    setWizardStep('deploying');
    setDeployProgress(0);

    let phase = 0;
    const interval = setInterval(() => {
      if (phase < DEPLOY_PHASES.length) {
        setDeployPhase(DEPLOY_PHASES[phase]);
        setDeployProgress(Math.round(((phase + 1) / DEPLOY_PHASES.length) * 100));
        phase++;
      } else {
        clearInterval(interval);
        const stored = getDeployedPluginIds();
        if (!stored.includes(pluginId!)) {
          setDeployedPluginIds([...stored, pluginId!]);
        }
        setDeployed(true);
        setWizardStep('done');
      }
    }, 800);

    return () => clearInterval(interval);
  }, [pluginId]);

  const handleUndeploy = () => {
    const updated = getDeployedPluginIds().filter((id) => id !== pluginId);
    setDeployedPluginIds(updated);
    setDeployed(false);
  };

  if (!plugin) {
    return (
      <PageSection hasBodyWrapper={false}>
        <EmptyState>
          <Title headingLevel="h1" size="lg">Plugin Not Found</Title>
          <EmptyStateBody>The plugin you&apos;re looking for doesn&apos;t exist.</EmptyStateBody>
          <EmptyStateActions>
            <Button variant="primary" onClick={() => navigate('/plugins')}>Community Plugins</Button>
          </EmptyStateActions>
        </EmptyState>
      </PageSection>
    );
  }

  const categoryColors: Record<string, string> = {
    'optimization': '#8b5cf6',
    'data-pipeline': '#06b6d4',
    'resource-management': '#f59e0b',
    'monitoring': '#10b981',
    'security': '#ef4444',
    'integration': '#6366f1',
  };

  const color = categoryColors[plugin.category] || '#6b7280';

  return (
    <>
      <PageSection hasBodyWrapper={false} style={{ paddingTop: '16px', paddingBottom: '16px' }}>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} style={{ maxWidth: '960px' }}>
          <FlexItem>
            <CommunityPluginsBreadcrumb
              items={[
                { label: 'Developer Preview', to: '/plugins/developer-preview?tab=plugins' },
                { label: plugin.name },
              ]}
            />
          </FlexItem>

          <FlexItem>
            <Card style={{ borderTop: `3px solid ${color}` }}>
              <CardBody>
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
                  <FlexItem>
                    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                      <FlexItem>
                        <span style={{ fontSize: '3rem' }}>{plugin.icon}</span>
                      </FlexItem>
                      <FlexItem flex={{ default: 'flex_1' }}>
                        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                          <FlexItem>
                            <Title headingLevel="h1" size="2xl">{plugin.name}</Title>
                          </FlexItem>
                          <FlexItem>
                            <Label isCompact style={{ background: `${color}18`, color }}>
                              {PLUGIN_CATEGORIES[plugin.category]}
                            </Label>
                          </FlexItem>
                          {deployed && (
                            <FlexItem>
                              <Label color="blue" isCompact>Deployed</Label>
                            </FlexItem>
                          )}
                        </Flex>
                        <p style={{ color: '#6b7280', margin: '4px 0 0' }}>{plugin.description}</p>
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem>
                    <Flex gap={{ default: 'gapSm' }}>
                      {!deployed ? (
                        <FlexItem>
                          <Button variant="primary" icon={<DownloadIcon />} onClick={startDeployWizard}>
                            Deploy Plugin
                          </Button>
                        </FlexItem>
                      ) : (
                        <>
                          <FlexItem>
                            <Button
                              variant="primary"
                              icon={<ExternalLinkAltIcon />}
                              onClick={() => navigate(getPluginWorkspacePath(plugin.id))}
                            >
                              Open Workspace
                            </Button>
                          </FlexItem>
                          <FlexItem>
                            <Button variant="secondary" icon={<TrashIcon />} isDanger onClick={handleUndeploy}>
                              Undeploy
                            </Button>
                          </FlexItem>
                        </>
                      )}
                    </Flex>
                  </FlexItem>

                  <Divider />

                  <FlexItem>
                    <Content>
                      <Title headingLevel="h3" size="md" style={{ marginBottom: '8px' }}>About</Title>
                      <p style={{ color: '#374151', lineHeight: 1.6 }}>{plugin.longDescription}</p>
                    </Content>
                  </FlexItem>

                  <Divider />

                  <FlexItem>
                    <Title headingLevel="h3" size="md" style={{ marginBottom: '12px' }}>Features</Title>
                    <Flex gap={{ default: 'gapSm' }} wrap={{ default: 'wrap' }}>
                      {plugin.features.map((f) => (
                        <Label key={f} color="blue">{f}</Label>
                      ))}
                    </Flex>
                  </FlexItem>

                  <Divider />

                  <FlexItem>
                    <DescriptionList isHorizontal>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Version</DescriptionListTerm>
                        <DescriptionListDescription>{plugin.version}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Author</DescriptionListTerm>
                        <DescriptionListDescription>{plugin.author}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Category</DescriptionListTerm>
                        <DescriptionListDescription>{PLUGIN_CATEGORIES[plugin.category]}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Plugin ID</DescriptionListTerm>
                        <DescriptionListDescription><code>{plugin.id}</code></DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Deploy Wizard Modal */}
      <Modal
        variant={ModalVariant.medium}
        isOpen={wizardOpen}
        onClose={() => wizardStep !== 'deploying' && setWizardOpen(false)}
        aria-label="Deploy plugin"
      >
        <ModalHeader title={`Deploy ${plugin.name}`} />
        <ModalBody>
          {wizardStep === 'configure' && (
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
              <FlexItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                  <FlexItem>
                    <span style={{ fontSize: '2.5rem' }}>{plugin.icon}</span>
                  </FlexItem>
                  <FlexItem>
                    <Title headingLevel="h3" size="lg">{plugin.name} v{plugin.version}</Title>
                    <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '0.9rem' }}>
                      {plugin.description}
                    </p>
                  </FlexItem>
                </Flex>
              </FlexItem>

              <Divider />

              <FlexItem>
                <FormGroup label="Target Namespace" isRequired fieldId="ns-input">
                  <TextInput
                    id="ns-input"
                    value={namespace}
                    onChange={(_e, val) => setNamespace(val)}
                    isRequired
                  />
                </FormGroup>
              </FlexItem>

              <FlexItem>
                <Title headingLevel="h4" size="md" style={{ marginBottom: '8px' }}>What will be deployed</Title>
                <DescriptionList isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Plugin Operator</DescriptionListTerm>
                    <DescriptionListDescription>{plugin.id}-operator</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Namespace</DescriptionListTerm>
                    <DescriptionListDescription>{namespace}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Components</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Flex gap={{ default: 'gapXs' }} wrap={{ default: 'wrap' }}>
                        {plugin.features.map((f) => (
                          <Label key={f} isCompact>{f}</Label>
                        ))}
                      </Flex>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>RBAC</DescriptionListTerm>
                    <DescriptionListDescription>ServiceAccount, Role, RoleBinding</DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </FlexItem>
            </Flex>
          )}

          {wizardStep === 'deploying' && (
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }} style={{ padding: '1rem 0' }}>
              <FlexItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }} justifyContent={{ default: 'justifyContentCenter' }}>
                  <FlexItem><Spinner size="lg" /></FlexItem>
                  <FlexItem>
                    <Title headingLevel="h3" size="lg">Deploying {plugin.name}...</Title>
                  </FlexItem>
                </Flex>
              </FlexItem>

              <FlexItem>
                <Progress
                  value={deployProgress}
                  title="Deployment progress"
                  measureLocation={ProgressMeasureLocation.outside}
                  aria-label="Deploy progress"
                />
              </FlexItem>

              <FlexItem>
                <div style={{
                  background: '#111827',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: '#10b981',
                  minHeight: '60px',
                }}>
                  <span style={{ color: '#6b7280' }}>$</span> {deployPhase}
                  <span className="terminal-cursor" style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '14px',
                    background: '#10b981',
                    marginLeft: '4px',
                    animation: 'blink 1s step-end infinite',
                    verticalAlign: 'text-bottom',
                  }} />
                </div>
              </FlexItem>

              <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
            </Flex>
          )}

          {wizardStep === 'done' && (
            <Flex
              direction={{ default: 'column' }}
              alignItems={{ default: 'alignItemsCenter' }}
              gap={{ default: 'gapLg' }}
              style={{ padding: '2rem 0' }}
            >
              <FlexItem>
                <CheckCircleIcon style={{ fontSize: '3.5rem', color: '#16a34a' }} />
              </FlexItem>
              <FlexItem>
                <Title headingLevel="h3" size="xl">{plugin.name} Deployed</Title>
              </FlexItem>
              <FlexItem>
                <Alert
                  variant="success"
                  isInline
                  isPlain
                  title={`${plugin.name} v${plugin.version} has been deployed to namespace "${namespace}" successfully.`}
                />
              </FlexItem>
              <FlexItem>
                <Flex gap={{ default: 'gapXs' }} wrap={{ default: 'wrap' }} justifyContent={{ default: 'justifyContentCenter' }}>
                  {plugin.features.map((f) => (
                    <Label key={f} color="green" isCompact>{f} ready</Label>
                  ))}
                </Flex>
              </FlexItem>
            </Flex>
          )}
        </ModalBody>
        <ModalFooter>
          {wizardStep === 'configure' && (
            <Flex gap={{ default: 'gapSm' }}>
              <FlexItem>
                <Button
                  variant="primary"
                  onClick={runDeploy}
                  isDisabled={!namespace.trim()}
                  icon={<DownloadIcon />}
                >
                  Deploy
                </Button>
              </FlexItem>
              <FlexItem>
                <Button variant="link" onClick={() => setWizardOpen(false)}>Cancel</Button>
              </FlexItem>
            </Flex>
          )}
          {wizardStep === 'deploying' && (
            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Please wait, deployment in progress...</p>
          )}
          {wizardStep === 'done' && (
            <Flex gap={{ default: 'gapSm' }}>
              <Button
                variant="primary"
                icon={<ExternalLinkAltIcon />}
                onClick={() => {
                  setWizardOpen(false);
                  navigate(getPluginWorkspacePath(plugin.id));
                }}
              >
                Go to Workspace
              </Button>
              <Button variant="secondary" onClick={() => setWizardOpen(false)}>Done</Button>
            </Flex>
          )}
        </ModalFooter>
      </Modal>
    </>
  );
};

export { PluginDetail };
