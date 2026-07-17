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
  Button,
  Flex,
  FlexItem,
  Content,
  Label,
  Tabs,
  Tab,
  TabTitleText,
  TextInput,
  FormGroup,
  Alert,
  Divider,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import {
  RocketIcon,
  ArrowRightIcon,
  PluggedIcon,
  CheckCircleIcon,
  CubesIcon,
  UploadIcon,
} from '@patternfly/react-icons';
import { PluginBrowseSection } from './PluginBrowseSection';

interface LandingTile {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: 'blue' | 'green' | 'purple';
  accent: string;
}

const LANDING_TILES: LandingTile[] = [
  {
    id: 'quickstarts',
    title: 'Quickstarts',
    description: 'Launch pre-built workflow templates and get productive in minutes with guided project setup.',
    href: '/plugins/quickstarts',
    icon: <RocketIcon style={{ fontSize: '2rem', color: '#8b5cf6' }} />,
    badge: 'Guided',
    badgeColor: 'blue',
    accent: '#8b5cf6',
  },
  {
    id: 'browse',
    title: 'Browse Plugins',
    description: 'Discover community plugins for optimization, data pipelines, monitoring, security, and more.',
    href: '/plugins#browse',
    icon: <CubesIcon style={{ fontSize: '2rem', color: '#3b82f6' }} />,
    badge: 'Catalog',
    badgeColor: 'purple',
    accent: '#3b82f6',
  },
  {
    id: 'deployed',
    title: 'Deployed',
    description: 'Jump to plugins you have already deployed and open their interactive workspaces.',
    href: '/plugins/deployed',
    icon: <CheckCircleIcon style={{ fontSize: '2rem', color: '#10b981' }} />,
    badge: 'Active',
    badgeColor: 'green',
    accent: '#10b981',
  },
];

/* ── BYOP: Bring Your Own Plugin ── */

type BYOPStep = 'input' | 'validate' | 'register';

interface BYOPState {
  step: BYOPStep;
  name: string;
  repoUrl: string;
  version: string;
  author: string;
  description: string;
  category: string;
  validated: boolean;
  registering: boolean;
  registered: boolean;
}

const BYOP_INITIAL: BYOPState = {
  step: 'input',
  name: '',
  repoUrl: '',
  version: '1.0.0',
  author: '',
  description: '',
  category: 'integration',
  validated: false,
  registering: false,
  registered: false,
};

const BYOPTab: React.FunctionComponent = () => {
  const [s, setS] = React.useState<BYOPState>(BYOP_INITIAL);
  const update = (patch: Partial<BYOPState>) => setS((prev) => ({ ...prev, ...patch }));

  const handleValidate = () => {
    update({ validated: false });
    setTimeout(() => update({ validated: true, step: 'validate', name: s.name || s.repoUrl.split('/').pop() || 'custom-plugin' }), 1200);
  };

  const handleRegister = () => {
    update({ registering: true, step: 'register' });
    setTimeout(() => update({ registering: false, registered: true }), 2000);
  };

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} style={{ marginTop: 12 }}>
      <FlexItem>
        <Flex gap={{ default: 'gapMd' }}>
          <Label color={s.step === 'input' ? 'blue' : 'grey'} isCompact>1. Plugin Source</Label>
          <ArrowRightIcon style={{ color: '#d1d5db' }} />
          <Label color={s.step === 'validate' ? 'blue' : 'grey'} isCompact>2. Validate</Label>
          <ArrowRightIcon style={{ color: '#d1d5db' }} />
          <Label color={s.step === 'register' ? 'green' : 'grey'} isCompact>3. Register</Label>
        </Flex>
      </FlexItem>
      <Divider />

      {s.step === 'input' && (
        <FlexItem>
          <Card>
            <CardHeader><CardTitle>Bring Your Own Plugin</CardTitle></CardHeader>
            <CardBody>
              <Content><p style={{ color: '#6b7280', margin: '0 0 16px', fontSize: '0.9rem' }}>
                Provide a GitHub repository or plugin package URL to register your own plugin in the catalog.
              </p></Content>
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
                <FormGroup label="Plugin repository URL" isRequired fieldId="byop-repo">
                  <TextInput id="byop-repo" isRequired placeholder="https://github.com/org/my-plugin" value={s.repoUrl} onChange={(_e, v) => update({ repoUrl: v })} />
                </FormGroup>
                <FormGroup label="Plugin name" fieldId="byop-name">
                  <TextInput id="byop-name" placeholder="my-custom-plugin" value={s.name} onChange={(_e, v) => update({ name: v })} />
                </FormGroup>
                <Flex gap={{ default: 'gapMd' }}>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <FormGroup label="Version" fieldId="byop-version">
                      <TextInput id="byop-version" value={s.version} onChange={(_e, v) => update({ version: v })} />
                    </FormGroup>
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <FormGroup label="Author" fieldId="byop-author">
                      <TextInput id="byop-author" placeholder="your-name" value={s.author} onChange={(_e, v) => update({ author: v })} />
                    </FormGroup>
                  </FlexItem>
                </Flex>
                <FormGroup label="Description" fieldId="byop-desc">
                  <TextInput id="byop-desc" placeholder="What does this plugin do?" value={s.description} onChange={(_e, v) => update({ description: v })} />
                </FormGroup>
                <FormGroup label="Category" fieldId="byop-cat">
                  <Flex gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
                    {['optimization', 'data-pipeline', 'resource-management', 'monitoring', 'security', 'integration'].map((cat) => (
                      <FlexItem key={cat}>
                        <Button variant={s.category === cat ? 'primary' : 'secondary'} size="sm" onClick={() => update({ category: cat })}>
                          {cat.replace(/-/g, ' ')}
                        </Button>
                      </FlexItem>
                    ))}
                  </Flex>
                </FormGroup>
                <Button variant="primary" icon={<ArrowRightIcon />} iconPosition="end" onClick={handleValidate} isDisabled={!s.repoUrl.trim()}>
                  Validate Plugin
                </Button>
              </Flex>
            </CardBody>
          </Card>
        </FlexItem>
      )}

      {s.step === 'validate' && (
        <FlexItem>
          <Card style={{ borderTop: '3px solid #3b82f6' }}>
            <CardHeader><CardTitle>Plugin Validated</CardTitle></CardHeader>
            <CardBody>
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
                {s.validated ? (
                  <Alert variant="success" isInline title="Plugin structure is valid and ready to register" />
                ) : (
                  <Alert variant="info" isInline title="Validating plugin structure..." />
                )}
                <DescriptionList isHorizontal>
                  <DescriptionListGroup><DescriptionListTerm>Name</DescriptionListTerm><DescriptionListDescription>{s.name}</DescriptionListDescription></DescriptionListGroup>
                  <DescriptionListGroup><DescriptionListTerm>Repository</DescriptionListTerm><DescriptionListDescription>{s.repoUrl}</DescriptionListDescription></DescriptionListGroup>
                  <DescriptionListGroup><DescriptionListTerm>Version</DescriptionListTerm><DescriptionListDescription>{s.version}</DescriptionListDescription></DescriptionListGroup>
                  <DescriptionListGroup><DescriptionListTerm>Author</DescriptionListTerm><DescriptionListDescription>{s.author || 'Community'}</DescriptionListDescription></DescriptionListGroup>
                  <DescriptionListGroup><DescriptionListTerm>Category</DescriptionListTerm><DescriptionListDescription><Label isCompact>{s.category}</Label></DescriptionListDescription></DescriptionListGroup>
                </DescriptionList>
                <Flex gap={{ default: 'gapSm' }}>
                  <Button variant="primary" icon={<CheckCircleIcon />} onClick={handleRegister} isDisabled={!s.validated}>Register Plugin</Button>
                  <Button variant="link" onClick={() => update({ step: 'input', validated: false })}>Back</Button>
                </Flex>
              </Flex>
            </CardBody>
          </Card>
        </FlexItem>
      )}

      {s.step === 'register' && (
        <FlexItem>
          {s.registering ? (
            <Card><CardBody style={{ textAlign: 'center', padding: '3rem' }}>
              <Title headingLevel="h3" size="lg">Registering {s.name}...</Title>
              <Content><p style={{ color: '#6b7280', marginTop: 8 }}>Installing plugin and configuring workspace nodes.</p></Content>
            </CardBody></Card>
          ) : s.registered ? (
            <Card style={{ borderTop: '3px solid #10b981' }}>
              <CardBody style={{ textAlign: 'center', padding: '2rem' }}>
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
                  <FlexItem><CheckCircleIcon style={{ fontSize: '3rem', color: '#10b981' }} /></FlexItem>
                  <FlexItem><Title headingLevel="h3" size="lg">Plugin registered successfully</Title></FlexItem>
                  <FlexItem><Content><p style={{ color: '#6b7280' }}>{s.name} v{s.version} is now available in the plugin catalog.</p></Content></FlexItem>
                  <FlexItem>
                    <Button variant="secondary" onClick={() => setS(BYOP_INITIAL)}>Register Another</Button>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          ) : null}
        </FlexItem>
      )}
    </Flex>
  );
};

const CommunityPluginsLanding: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<string | number>(0);

  const handleTileClick = (href: string) => {
    if (href.includes('#')) {
      const [path, hash] = href.split('#');
      navigate(path);
      window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }
    navigate(href);
  };

  return (
    <PageSection hasBodyWrapper={false} style={{ paddingTop: '32px', paddingBottom: '32px' }}>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
        <FlexItem>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            <FlexItem>
              <Title headingLevel="h1" size="2xl">
                <PluggedIcon style={{ marginRight: '10px', color: '#3b82f6' }} />
                Community Plugins
              </Title>
            </FlexItem>
          </Flex>
          <Content>
            <p style={{ color: '#6b7280', margin: '8px 0 0', fontSize: '1rem' }}>
              Launch guided templates, browse the plugin catalog, bring your own plugins, and manage your deployed workspaces.
            </p>
          </Content>
        </FlexItem>

        <FlexItem>
          <Tabs activeKey={activeTab} onSelect={(_e, key) => setActiveTab(key)} aria-label="Community plugins tabs">

            <Tab eventKey={0} title={<TabTitleText><CubesIcon style={{ marginRight: 6 }} />Overview</TabTitleText>}>
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }} style={{ marginTop: 16 }}>
                <FlexItem>
                  <Flex gap={{ default: 'gapLg' }} direction={{ default: 'column', md: 'row' }}>
                    {LANDING_TILES.map((tile) => (
                      <FlexItem key={tile.id} flex={{ default: 'flex_1' }}>
                        <Card
                          isFullHeight
                          style={{ borderTop: `4px solid ${tile.accent}`, cursor: 'pointer', minHeight: '220px' }}
                          onClick={() => handleTileClick(tile.href)}
                        >
                          <CardHeader>
                            <CardTitle>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                                <FlexItem>
                                  <div style={{
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '12px',
                                    background: `${tile.accent}14`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}>
                                    {tile.icon}
                                  </div>
                                </FlexItem>
                                <FlexItem flex={{ default: 'flex_1' }}>
                                  <span style={{ fontWeight: 600, fontSize: '1.25rem' }}>{tile.title}</span>
                                </FlexItem>
                                <FlexItem>
                                  <Label color={tile.badgeColor}>{tile.badge}</Label>
                                </FlexItem>
                              </Flex>
                            </CardTitle>
                          </CardHeader>
                          <CardBody>
                            <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
                              {tile.description}
                            </p>
                          </CardBody>
                          <CardFooter>
                            <Button
                              variant="link"
                              isInline
                              icon={<ArrowRightIcon />}
                              iconPosition="end"
                              style={{ fontSize: '0.95rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTileClick(tile.href);
                              }}
                            >
                              Explore
                            </Button>
                          </CardFooter>
                        </Card>
                      </FlexItem>
                    ))}
                  </Flex>
                </FlexItem>
                <FlexItem id="browse">
                  <Title headingLevel="h2" size="lg" style={{ marginBottom: '12px' }}>Plugin catalog</Title>
                  <PluginBrowseSection showSectionHeader={false} />
                </FlexItem>
              </Flex>
            </Tab>

            <Tab eventKey={1} title={<TabTitleText><UploadIcon style={{ marginRight: 6 }} />BYOP</TabTitleText>}>
              <BYOPTab />
            </Tab>

          </Tabs>
        </FlexItem>
      </Flex>
    </PageSection>
  );
};

export { CommunityPluginsLanding };
