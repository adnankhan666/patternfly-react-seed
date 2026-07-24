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
import {
  getPluginById,
  PLUGIN_CATEGORIES,
  getPluginWorkspacePath,
  getPluginState,
  isPluginInstalled,
  simulateInstall,
  simulateRemove,
  PLUGIN_STATE_EVENT,
  LifecycleStep,
} from '../../data/pluginRegistry';
import { CommunityPluginsBreadcrumb } from './CommunityPluginsBreadcrumb';
import { SupportLevelBanner } from '../components/SupportLevelBanner';

type WizardStep = 'configure' | 'deploying' | 'done';

const PluginDetail: React.FunctionComponent = () => {
  const { pluginId } = useParams<{ pluginId: string }>();
  const navigate = useNavigate();
  const plugin = pluginId ? getPluginById(pluginId) : undefined;

  const [deployed, setDeployed] = React.useState(() => {
    return pluginId ? isPluginInstalled(pluginId) : false;
  });

  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [wizardStep, setWizardStep] = React.useState<WizardStep>('configure');
  const [namespace, setNamespace] = React.useState('');
  const [lifecycleSteps, setLifecycleSteps] = React.useState<LifecycleStep[]>([]);

  React.useEffect(() => {
    localStorage.setItem('visitedPlugins', 'true');
  }, []);

  React.useEffect(() => {
    if (!pluginId) return;
    const refresh = () => setDeployed(isPluginInstalled(pluginId));
    window.addEventListener(PLUGIN_STATE_EVENT, refresh);
    return () => window.removeEventListener(PLUGIN_STATE_EVENT, refresh);
  }, [pluginId]);

  const startDeployWizard = () => {
    setWizardStep('configure');
    setNamespace(plugin?.name ?? 'default');
    setLifecycleSteps([]);
    setWizardOpen(true);
  };

  const runDeploy = React.useCallback(async () => {
    if (!plugin) return;
    setWizardStep('deploying');

    const watchSteps = () => {
      const state = getPluginState(plugin.name);
      if (state?.steps) setLifecycleSteps([...state.steps]);
    };
    window.addEventListener(PLUGIN_STATE_EVENT, watchSteps);

    await simulateInstall(plugin, namespace || undefined);

    window.removeEventListener(PLUGIN_STATE_EVENT, watchSteps);
    const finalState = getPluginState(plugin.name);
    if (finalState?.steps) setLifecycleSteps([...finalState.steps]);
    setDeployed(true);
    setWizardStep('done');
  }, [plugin, namespace]);

  const handleUndeploy = async () => {
    if (!plugin) return;
    await simulateRemove(plugin);
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
  const installMethodLabels: Record<string, string> = {
    automatic: 'One-click install',
    assisted: 'Guided install',
    manual: 'Manual install',
  };
  const deploymentModelLabels: Record<string, string> = {
    'per-project': 'Per-project',
    'cluster-shared': 'Cluster-shared',
    both: 'Per-project or Cluster-shared',
  };

  const deployProgress = lifecycleSteps.length > 0
    ? Math.round((lifecycleSteps.filter((s) => s.status === 'completed').length / lifecycleSteps.length) * 100)
    : 0;
  const currentStep = lifecycleSteps.find((s) => s.status === 'running') ?? lifecycleSteps[lifecycleSteps.length - 1];

  return (
    <>
      <PageSection hasBodyWrapper={false} style={{ paddingTop: '16px', paddingBottom: '16px' }}>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} style={{ maxWidth: '960px' }}>
          <FlexItem>
            <CommunityPluginsBreadcrumb
              items={[
                { label: 'Community Plugins', to: '/plugins' },
                { label: plugin.displayName },
              ]}
            />
          </FlexItem>

          <FlexItem>
            <SupportLevelBanner context="community-plugins" />
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
                        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} wrap={{ default: 'wrap' }}>
                          <FlexItem>
                            <Title headingLevel="h1" size="2xl">{plugin.displayName}</Title>
                          </FlexItem>
                          <FlexItem>
                            <Label isCompact style={{ background: `${color}18`, color }}>
                              {PLUGIN_CATEGORIES[plugin.category]}
                            </Label>
                          </FlexItem>
                          <FlexItem>
                            <Label isCompact color={plugin.status === 'stable' ? 'green' : 'orange'}>
                              {plugin.status}
                            </Label>
                          </FlexItem>
                          {deployed && (
                            <FlexItem>
                              <Label color="blue" isCompact>Installed</Label>
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
                        plugin.install.method !== 'manual' ? (
                          <FlexItem>
                            <Button variant="primary" icon={<DownloadIcon />} onClick={startDeployWizard}>
                              {plugin.install.method === 'automatic' ? 'Install Plugin' : 'Configure & Install'}
                            </Button>
                          </FlexItem>
                        ) : (
                          <FlexItem>
                            <Button
                              variant="secondary"
                              icon={<ExternalLinkAltIcon />}
                              component="a"
                              href={plugin.install.instructions}
                              target="_blank"
                            >
                              View Install Instructions
                            </Button>
                          </FlexItem>
                        )
                      ) : (
                        <>
                          <FlexItem>
                            <Button
                              variant="primary"
                              icon={<ExternalLinkAltIcon />}
                              onClick={() => navigate(getPluginWorkspacePath(plugin.name))}
                            >
                              Open Workspace
                            </Button>
                          </FlexItem>
                          <FlexItem>
                            <Button variant="secondary" icon={<TrashIcon />} isDanger onClick={handleUndeploy}>
                              Remove
                            </Button>
                          </FlexItem>
                        </>
                      )}
                    </Flex>
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
                        <DescriptionListTerm>Maintainer</DescriptionListTerm>
                        <DescriptionListDescription>
                          {plugin.maintainer.name} (<code>@{plugin.maintainer.github}</code>)
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Maintenance</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Label isCompact color={plugin.maintenance === 'red-hat' ? 'red' : 'blue'}>
                            {plugin.maintenance === 'red-hat' ? 'Red Hat' : 'Community'}
                          </Label>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Install Method</DescriptionListTerm>
                        <DescriptionListDescription>{installMethodLabels[plugin.install.method]}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Deployment Model</DescriptionListTerm>
                        <DescriptionListDescription>{deploymentModelLabels[plugin.deploymentModel]}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>RHOAI Compatibility</DescriptionListTerm>
                        <DescriptionListDescription>
                          {plugin.rhoaiCompatibility.minVersion}+ (tested: {plugin.rhoaiCompatibility.testedVersions.join(', ')})
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Container Image</DescriptionListTerm>
                        <DescriptionListDescription><code>{plugin.image.repository}:{plugin.image.tag}</code></DescriptionListDescription>
                      </DescriptionListGroup>
                      {plugin.bffImage && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>BFF Image</DescriptionListTerm>
                          <DescriptionListDescription><code>{plugin.bffImage.repository}:{plugin.bffImage.tag}</code></DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                      <DescriptionListGroup>
                        <DescriptionListTerm>MF Scope</DescriptionListTerm>
                        <DescriptionListDescription><code>{plugin.remote.spec.scope}</code></DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>RBAC</DescriptionListTerm>
                        <DescriptionListDescription>
                          {plugin.rbac.clusterRoles ? (
                            <Label isCompact color="orange">Cluster roles required</Label>
                          ) : (
                            <Label isCompact color="green">Namespace-scoped</Label>
                          )}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      {plugin.support.repo && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Repository</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Button variant="link" isInline component="a" href={plugin.support.repo} target="_blank" icon={<ExternalLinkAltIcon />} iconPosition="end">
                              {plugin.repo}
                            </Button>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                      <DescriptionListGroup>
                        <DescriptionListTerm>Plugin Name</DescriptionListTerm>
                        <DescriptionListDescription><code>{plugin.name}</code></DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </FlexItem>
        </Flex>
      </PageSection>

      <Modal
        variant={ModalVariant.medium}
        isOpen={wizardOpen}
        onClose={() => wizardStep !== 'deploying' && setWizardOpen(false)}
        aria-label="Install plugin"
      >
        <ModalHeader title={`Install ${plugin.displayName}`} />
        <ModalBody>
          {wizardStep === 'configure' && (
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
              <FlexItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                  <FlexItem>
                    <span style={{ fontSize: '2.5rem' }}>{plugin.icon}</span>
                  </FlexItem>
                  <FlexItem>
                    <Title headingLevel="h3" size="lg">{plugin.displayName} v{plugin.version}</Title>
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
                    <DescriptionListTerm>Helm Chart</DescriptionListTerm>
                    <DescriptionListDescription><code>{plugin.install.helm?.registry ?? 'N/A'}</code></DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Namespace</DescriptionListTerm>
                    <DescriptionListDescription>{namespace || plugin.name}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Deployment Model</DescriptionListTerm>
                    <DescriptionListDescription>{deploymentModelLabels[plugin.deploymentModel]}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>MF Registration</DescriptionListTerm>
                    <DescriptionListDescription>
                      <code>{plugin.remote.spec.scope}</code> will be added to MODULE_FEDERATION_CONFIG
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  {plugin.bffImage && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>BFF Service</DescriptionListTerm>
                      <DescriptionListDescription>
                        <code>{plugin.name}-bff</code> (port 3000)
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                </DescriptionList>
              </FlexItem>

              {plugin.install.prerequisites && plugin.install.prerequisites.length > 0 && (
                <FlexItem>
                  <Alert variant="info" isInline title="Prerequisites">
                    {plugin.install.prerequisites.map((p) => (
                      <div key={p.name} style={{ fontSize: '0.85rem' }}>{p.description} (<code>{p.name}</code>)</div>
                    ))}
                  </Alert>
                </FlexItem>
              )}
            </Flex>
          )}

          {wizardStep === 'deploying' && (
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }} style={{ padding: '1rem 0' }}>
              <FlexItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }} justifyContent={{ default: 'justifyContentCenter' }}>
                  <FlexItem><Spinner size="lg" /></FlexItem>
                  <FlexItem>
                    <Title headingLevel="h3" size="lg">Installing {plugin.displayName}...</Title>
                  </FlexItem>
                </Flex>
              </FlexItem>

              <FlexItem>
                <Progress
                  value={deployProgress}
                  title="Installation progress"
                  measureLocation={ProgressMeasureLocation.outside}
                  aria-label="Install progress"
                />
              </FlexItem>

              <FlexItem>
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
                  {lifecycleSteps.map((step) => (
                    <Flex key={step.id} alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                      <FlexItem>
                        {step.status === 'completed' && <CheckCircleIcon style={{ color: '#16a34a' }} />}
                        {step.status === 'running' && <Spinner size="sm" />}
                        {step.status === 'pending' && <span style={{ color: '#9ca3af' }}>&#x25CB;</span>}
                        {step.status === 'failed' && <span style={{ color: '#ef4444' }}>&#x2717;</span>}
                      </FlexItem>
                      <FlexItem>
                        <span style={{ color: step.status === 'pending' ? '#9ca3af' : undefined, fontSize: '0.9rem' }}>
                          {step.label}
                        </span>
                      </FlexItem>
                    </Flex>
                  ))}
                </Flex>
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
                <Title headingLevel="h3" size="xl">{plugin.displayName} Installed</Title>
              </FlexItem>
              <FlexItem>
                <Alert
                  variant="success"
                  isInline
                  isPlain
                  title={`${plugin.displayName} v${plugin.version} has been installed to namespace "${namespace || plugin.name}" and registered in MODULE_FEDERATION_CONFIG.`}
                />
              </FlexItem>
              <FlexItem>
                <Flex gap={{ default: 'gapXs' }} wrap={{ default: 'wrap' }} justifyContent={{ default: 'justifyContentCenter' }}>
                  {lifecycleSteps.filter((s) => s.status === 'completed').map((s) => (
                    <Label key={s.id} color="green" isCompact>{s.label}</Label>
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
                  Install
                </Button>
              </FlexItem>
              <FlexItem>
                <Button variant="link" onClick={() => setWizardOpen(false)}>Cancel</Button>
              </FlexItem>
            </Flex>
          )}
          {wizardStep === 'deploying' && (
            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
              {currentStep ? currentStep.label : 'Please wait, installation in progress...'}
            </p>
          )}
          {wizardStep === 'done' && (
            <Flex gap={{ default: 'gapSm' }}>
              <Button
                variant="primary"
                icon={<ExternalLinkAltIcon />}
                onClick={() => {
                  setWizardOpen(false);
                  navigate(getPluginWorkspacePath(plugin.name));
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
