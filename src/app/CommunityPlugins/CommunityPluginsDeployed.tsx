import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Gallery,
  GalleryItem,
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
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { CheckCircleIcon, ExternalLinkAltIcon, CubesIcon } from '@patternfly/react-icons';
import {
  PLUGINS,
  PLUGIN_CATEGORIES,
  PLUGIN_DEPLOYED_EVENT,
  getDeployedPluginIds,
  getPluginById,
  getPluginWorkspacePath,
} from '../../data/pluginRegistry';
import { CommunityPluginsBreadcrumb } from './CommunityPluginsBreadcrumb';

const categoryColors: Record<string, string> = {
  'optimization': '#8b5cf6',
  'data-pipeline': '#06b6d4',
  'resource-management': '#f59e0b',
  'monitoring': '#10b981',
  'security': '#ef4444',
  'integration': '#6366f1',
};

const CommunityPluginsDeployed: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [deployedIds, setDeployedIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    const refresh = () => setDeployedIds(getDeployedPluginIds());
    refresh();
    window.addEventListener(PLUGIN_DEPLOYED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(PLUGIN_DEPLOYED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const deployedPlugins = deployedIds
    .map((id) => getPluginById(id))
    .filter(Boolean) as typeof PLUGINS;

  return (
    <PageSection hasBodyWrapper={false} style={{ paddingTop: '16px', paddingBottom: '16px' }}>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        <FlexItem>
          <CommunityPluginsBreadcrumb items={[{ label: 'Deployed' }]} />
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            <FlexItem>
              <Title headingLevel="h1" size="xl">
                <CheckCircleIcon style={{ marginRight: '8px', color: '#10b981' }} />
                Deployed Plugins
              </Title>
            </FlexItem>
          </Flex>
          <Content>
            <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '0.9rem' }}>
              Community plugins you have deployed. Open a workspace from a card or the sidebar.
            </p>
          </Content>
        </FlexItem>

        <FlexItem>
          {deployedPlugins.length === 0 ? (
            <EmptyState>
              <CubesIcon style={{ fontSize: '3rem', color: '#9ca3af' }} />
              <Title headingLevel="h2" size="lg">No deployed plugins yet</Title>
              <EmptyStateBody>
                Browse the plugin catalog, pick a plugin, and deploy it to see it here.
              </EmptyStateBody>
              <EmptyStateFooter>
                <Button variant="primary" onClick={() => navigate('/plugins')}>
                  Browse Plugins
                </Button>
              </EmptyStateFooter>
            </EmptyState>
          ) : (
            <Gallery hasGutter minWidths={{ default: '300px' }} maxWidths={{ default: '1fr' }} style={{ padding: '3px' }}>
              {deployedPlugins.map((plugin) => {
                const color = categoryColors[plugin.category] || '#6b7280';
                return (
                  <GalleryItem key={plugin.id}>
                    <Card
                      isFullHeight
                      style={{ borderTop: `3px solid ${color}`, cursor: 'pointer' }}
                      onClick={() => navigate(`/plugins/${plugin.id}`)}
                    >
                      <CardHeader>
                        <CardTitle>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                            <FlexItem>
                              <span style={{ fontSize: '1.5rem' }}>{plugin.icon}</span>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <span style={{ fontWeight: 600 }}>{plugin.name}</span>
                            </FlexItem>
                            <FlexItem>
                              <Label color="green" isCompact>Deployed</Label>
                            </FlexItem>
                          </Flex>
                        </CardTitle>
                      </CardHeader>
                      <CardBody>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 8px' }}>
                          {plugin.description}
                        </p>
                        <Flex gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
                          <Label isCompact style={{ background: `${color}18`, color }}>
                            {PLUGIN_CATEGORIES[plugin.category]}
                          </Label>
                          <Label isCompact>v{plugin.version}</Label>
                        </Flex>
                      </CardBody>
                      <CardFooter>
                        <Button
                          variant="link"
                          isInline
                          icon={<ExternalLinkAltIcon />}
                          iconPosition="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(getPluginWorkspacePath(plugin.id));
                          }}
                        >
                          Open workspace
                        </Button>
                      </CardFooter>
                    </Card>
                  </GalleryItem>
                );
              })}
            </Gallery>
          )}
        </FlexItem>

        {deployedPlugins.length > 0 && (
          <FlexItem>
            <Content>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.8rem' }}>
                {PLUGINS.length - deployedPlugins.length} other plugins available in the catalog.
              </p>
            </Content>
          </FlexItem>
        )}
      </Flex>
    </PageSection>
  );
};

export { CommunityPluginsDeployed };
