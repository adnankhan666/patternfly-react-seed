import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Label,
  SearchInput,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { PLUGINS, PLUGIN_CATEGORIES, getPluginWorkspacePath, getDeployedPluginIds, PLUGIN_DEPLOYED_EVENT } from '../../data/pluginRegistry';

interface PluginBrowseSectionProps {
  showSectionHeader?: boolean;
  deployedOnly?: boolean;
}

const categoryColors: Record<string, string> = {
  'optimization': '#8b5cf6',
  'data-pipeline': '#06b6d4',
  'resource-management': '#f59e0b',
  'monitoring': '#10b981',
  'security': '#ef4444',
  'integration': '#6366f1',
};

const PluginBrowseSection: React.FunctionComponent<PluginBrowseSectionProps> = ({
  showSectionHeader = true,
  deployedOnly = false,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [deployedPlugins, setDeployedPlugins] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const refresh = () => setDeployedPlugins(new Set(getDeployedPluginIds()));
    refresh();
    localStorage.setItem('visitedPlugins', 'true');
    window.addEventListener('storage', refresh);
    window.addEventListener(PLUGIN_DEPLOYED_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(PLUGIN_DEPLOYED_EVENT, refresh);
    };
  }, []);

  const sourcePlugins = deployedOnly
    ? PLUGINS.filter((p) => deployedPlugins.has(p.id))
    : PLUGINS;

  const filtered = sourcePlugins.filter((p) => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      {showSectionHeader && (
        <FlexItem>
          <Content>
            <Title headingLevel="h2" size="xl">Community Plugins</Title>
            <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
              Browse and deploy community-built extensions to enhance your AI/ML workflows
            </p>
          </Content>
        </FlexItem>
      )}

      <FlexItem>
        <Flex gap={{ default: 'gapMd' }} alignItems={{ default: 'alignItemsCenter' }} wrap="wrap">
          <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: '200px', maxWidth: '400px' }}>
            <SearchInput
              placeholder={deployedOnly ? 'Search deployed plugins...' : 'Search plugins...'}
              value={search}
              onChange={(_e, val) => setSearch(val)}
              onClear={() => setSearch('')}
            />
          </FlexItem>
          <FlexItem>
            <Flex gap={{ default: 'gapSm' }} wrap="wrap">
              <FlexItem>
                <Button
                  variant={activeCategory === null ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveCategory(null)}
                >
                  All ({sourcePlugins.length})
                </Button>
              </FlexItem>
              {Object.entries(PLUGIN_CATEGORIES).map(([key, label]) => {
                const count = sourcePlugins.filter((p) => p.category === key).length;
                if (deployedOnly && count === 0) return null;
                return (
                  <FlexItem key={key}>
                    <Button
                      variant={activeCategory === key ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setActiveCategory(activeCategory === key ? null : key)}
                      style={activeCategory === key ? { background: categoryColors[key], borderColor: categoryColors[key] } : {}}
                    >
                      {label} ({count})
                    </Button>
                  </FlexItem>
                );
              })}
            </Flex>
          </FlexItem>
        </Flex>
      </FlexItem>

      <FlexItem>
        {filtered.length === 0 ? (
          <Content>
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem 0' }}>
              {deployedOnly
                ? 'No plugins deployed yet. Deploy a plugin from its detail page to see it here.'
                : 'No plugins found matching your search.'}
            </p>
          </Content>
        ) : (
          <Gallery hasGutter minWidths={{ default: '240px' }} maxWidths={{ default: '1fr' }}>
            {filtered.map((plugin) => {
              const isDeployed = deployedPlugins.has(plugin.id);
              const color = categoryColors[plugin.category] || '#6b7280';
              return (
                <GalleryItem key={plugin.id}>
                  <Card
                    isCompact
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
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{plugin.name}</span>
                          </FlexItem>
                          {isDeployed && (
                            <FlexItem>
                              <Label color="blue" isCompact>Deployed</Label>
                            </FlexItem>
                          )}
                        </Flex>
                      </CardTitle>
                    </CardHeader>
                    <CardBody>
                      <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 10px' }}>
                        {plugin.description}
                      </p>
                      <Flex gap={{ default: 'gapXs' }} wrap="wrap">
                        {plugin.features.map((f) => (
                          <Label key={f} isCompact>{f}</Label>
                        ))}
                      </Flex>
                    </CardBody>
                    <CardFooter>
                      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                        <FlexItem>
                          <Label isCompact style={{ background: `${color}18`, color }}>{PLUGIN_CATEGORIES[plugin.category]}</Label>
                        </FlexItem>
                        <FlexItem>
                          <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                            {isDeployed && (
                              <Button
                                variant="link"
                                size="sm"
                                icon={<ExternalLinkAltIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(getPluginWorkspacePath(plugin.id));
                                }}
                              >
                                Workspace
                              </Button>
                            )}
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>v{plugin.version}</span>
                          </Flex>
                        </FlexItem>
                      </Flex>
                    </CardFooter>
                  </Card>
                </GalleryItem>
              );
            })}
          </Gallery>
        )}
      </FlexItem>
    </Flex>
  );
};

export { PluginBrowseSection };
