import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Gallery,
  GalleryItem,
  Button,
  Flex,
  FlexItem,
  Content,
} from '@patternfly/react-core';
import {
  PlusCircleIcon,
  CubesIcon,
  UsersIcon,
  ArrowRightIcon,
  FolderOpenIcon,
} from '@patternfly/react-icons';
import { DropText } from './DropText';
import { GettingStartedChecklist } from '../components/GettingStartedChecklist';
import { WhatsNewBanner } from '../components/WhatsNewBanner';
import { CommunityPopover } from '../components/CommunityPopover';
import './Dashboard.css';

const Dashboard: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [recentProjects, setRecentProjects] = React.useState<string[]>([]);
  const [showSplash, setShowSplash] = React.useState(true);
  const [splashFading, setSplashFading] = React.useState(false);

  React.useEffect(() => {
    const projects = JSON.parse(localStorage.getItem('canvasProjects') || '[]');
    setRecentProjects(projects);
  }, []);

  React.useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      setSplashFading(true);
      setTimeout(() => {
        setShowSplash(false);
      }, 800);
    }, 4500);
    return () => clearTimeout(timer);
  }, [showSplash]);

  const dismissSplash = () => {
    setSplashFading(true);
    setTimeout(() => {
      setShowSplash(false);
    }, 500);
  };

  const quickStartItems = [
    {
      title: 'Create New Project',
      description: 'Start a new canvas project from scratch',
      icon: <PlusCircleIcon style={{ color: '#06b6d4', fontSize: '1.5rem' }} />,
      action: () => navigate('/canvas'),
    },
    {
      title: 'Model Catalog',
      description: 'Browse and deploy AI/ML models',
      icon: <CubesIcon style={{ color: '#f59e0b', fontSize: '1.5rem' }} />,
      action: () => navigate('/modelCatalog'),
    },
    {
      title: 'Community',
      description: 'Quickstarts, plugins, and developer previews',
      icon: <UsersIcon style={{ color: '#10b981', fontSize: '1.5rem' }} />,
      action: () => navigate('/plugins/developer-preview'),
      isCommunityTile: true,
    },
  ] as Array<{ title: string; description: string; icon: React.ReactNode; action?: () => void; isCommunityTile?: boolean }>;

  return (
    <>
      {/* Fullscreen Splash Overlay */}
      {showSplash && (
        <div
          className={`splash-overlay ${splashFading ? 'splash-fading' : ''}`}
          onClick={dismissSplash}
        >
          <div className="splash-content">
            <DropText text="Welcome to Red AI" delay={100} />
            <div className="dust-container">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`dust-particle dust-${i + 1}`} />
              ))}
            </div>
          </div>
          <p className="splash-transition-text">Let&apos;s get started</p>
          <button className="splash-skip" onClick={dismissSplash}>
            Click anywhere or wait to continue
          </button>
        </div>
      )}

      {/* Dashboard Content (visible after splash) */}
      <div className="dashboard-hero-bar">
        <h1 className="dashboard-hero-title">Welcome to Red AI</h1>
        <p className="dashboard-hero-subtitle">
          Build, deploy, and manage AI workflows with ease
        </p>
      </div>

      <WhatsNewBanner />

      <PageSection hasBodyWrapper={false}>
        <Content style={{ marginBottom: '16px' }}>
          <Title headingLevel="h2" size="xl">Quick Start</Title>
          <p style={{ color: '#6b7280' }}>
            Jump right in with one of these common actions
          </p>
        </Content>
        <Gallery hasGutter minWidths={{ default: '280px' }}>
          {quickStartItems.map((item, index) => (
            <GalleryItem key={index}>
              <Card isCompact isFullHeight>
                <CardBody>
                  <Flex
                    direction={{ default: 'column' }}
                    gap={{ default: 'gapMd' }}
                    style={{ height: '100%' }}
                  >
                    <FlexItem>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                        <FlexItem>{item.icon}</FlexItem>
                        <FlexItem>
                          <span style={{ fontWeight: 600, fontSize: '1rem' }}>{item.title}</span>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                    <FlexItem>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                        {item.description}
                      </p>
                    </FlexItem>
                    <FlexItem align={{ default: 'alignRight' }} style={{ marginTop: 'auto' }}>
                      {item.isCommunityTile ? (
                        <Flex gap={{ default: 'gapMd' }}>
                          <FlexItem>
                            <Button
                              variant="link"
                              isInline
                              icon={<ArrowRightIcon />}
                              iconPosition="end"
                              onClick={item.action}
                            >
                              Explore
                            </Button>
                          </FlexItem>
                          <FlexItem>
                            <CommunityPopover>
                              <Button variant="link" isInline>
                                What&apos;s new
                              </Button>
                            </CommunityPopover>
                          </FlexItem>
                        </Flex>
                      ) : (
                        <Button
                          variant="link"
                          isInline
                          icon={<ArrowRightIcon />}
                          iconPosition="end"
                          onClick={item.action}
                        >
                          Get started
                        </Button>
                      )}
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </GalleryItem>
          ))}
        </Gallery>
      </PageSection>

      {recentProjects.length > 0 && (
        <PageSection hasBodyWrapper={false}>
          <Content style={{ marginBottom: '16px' }}>
            <Title headingLevel="h2" size="xl">Recent Projects</Title>
            <p style={{ color: '#6b7280' }}>
              Pick up where you left off
            </p>
          </Content>
          <Gallery hasGutter minWidths={{ default: '200px' }}>
            {recentProjects.slice(0, 8).map((project, index) => (
              <GalleryItem key={index}>
                <Card isCompact>
                  <CardBody>
                    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                      <FlexItem>
                        <FolderOpenIcon style={{ color: '#8b5cf6' }} />
                      </FlexItem>
                      <FlexItem flex={{ default: 'flex_1' }}>
                        <span style={{ fontWeight: 500 }}>{project}</span>
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="plain"
                          icon={<ArrowRightIcon />}
                          onClick={() =>
                            navigate(`/canvas/${project.toLowerCase().replace(/\s+/g, '-')}`)
                          }
                          aria-label={`Open ${project}`}
                        />
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              </GalleryItem>
            ))}
          </Gallery>
        </PageSection>
      )}

      <PageSection hasBodyWrapper={false}>
        <GettingStartedChecklist />
      </PageSection>
    </>
  );
};

export { Dashboard };
