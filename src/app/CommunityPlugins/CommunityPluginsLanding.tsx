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
  Label,
} from '@patternfly/react-core';
import {
  RocketIcon,
  FlaskIcon,
  BlueprintIcon,
  ArrowRightIcon,
  PluggedIcon,
} from '@patternfly/react-icons';

interface LandingTile {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: 'blue' | 'orange' | 'purple';
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
    id: 'developer-preview',
    title: 'Developer Preview',
    description: 'Explore early developer capabilities, upcoming features, and deployed community plugins.',
    href: '/plugins/developer-preview',
    icon: <FlaskIcon style={{ fontSize: '2rem', color: '#f59e0b' }} />,
    badge: 'DP',
    badgeColor: 'orange',
    accent: '#f59e0b',
  },
  {
    id: 'technical-preview',
    title: 'Technical Preview',
    description: 'Preview technical capabilities under evaluation, with access to deployed plugins and upcoming features.',
    href: '/plugins/technical-preview',
    icon: <BlueprintIcon style={{ fontSize: '2rem', color: '#6366f1' }} />,
    badge: 'TP',
    badgeColor: 'purple',
    accent: '#6366f1',
  },
];

const CommunityPluginsLanding: React.FunctionComponent = () => {
  const navigate = useNavigate();

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
              Choose a path to get started with guided templates, developer previews, or technical previews.
            </p>
          </Content>
        </FlexItem>

        <FlexItem>
          <Flex gap={{ default: 'gapLg' }} direction={{ default: 'column', md: 'row' }}>
            {LANDING_TILES.map((tile) => (
              <FlexItem key={tile.id} flex={{ default: 'flex_1' }}>
                <Card
                  isFullHeight
                  style={{ borderTop: `4px solid ${tile.accent}`, cursor: 'pointer', minHeight: '220px' }}
                  onClick={() => navigate(tile.href)}
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
                        navigate(tile.href);
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
      </Flex>
    </PageSection>
  );
};

export { CommunityPluginsLanding };
