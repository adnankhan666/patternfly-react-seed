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
import { CheckCircleIcon, ExternalLinkAltIcon, RocketIcon } from '@patternfly/react-icons';
import { EARLY_ACCESS_FEATURES, getEarlyAccessFeatureById } from '../../data/previewFeatures';
import {
  FEATURE_EXPERIENCED_EVENT,
  getDeployedFeatures,
  FeatureDeployment,
} from '../../data/featureExperienceStore';
import { EarlyAccessBreadcrumb } from './EarlyAccessBreadcrumb';
import { SupportLevelBanner } from '../components/SupportLevelBanner';

const statusColor = (status: FeatureDeployment['status']): 'blue' | 'green' | 'grey' => {
  if (status === 'running') return 'green';
  if (status === 'deploying') return 'blue';
  return 'grey';
};

const EarlyAccessDeployed: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [deployments, setDeployments] = React.useState<FeatureDeployment[]>([]);

  React.useEffect(() => {
    const refresh = () => setDeployments(getDeployedFeatures());
    refresh();
    window.addEventListener(FEATURE_EXPERIENCED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(FEATURE_EXPERIENCED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const activeDeployments = deployments.filter((d) => d.status !== 'stopped');

  return (
    <PageSection hasBodyWrapper={false} style={{ paddingTop: '16px', paddingBottom: '16px' }}>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        <FlexItem>
          <EarlyAccessBreadcrumb items={[{ label: 'Deployed' }]} />
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            <FlexItem>
              <Title headingLevel="h1" size="xl">
                <CheckCircleIcon style={{ marginRight: '8px', color: '#10b981' }} />
                Deployed Features
              </Title>
            </FlexItem>
          </Flex>
          <Content>
            <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '0.9rem' }}>
              Features you have experienced via Early Access sandboxes. These pages are not listed in the main navigation.
            </p>
          </Content>
        </FlexItem>

        <FlexItem>
          <SupportLevelBanner context="early-access" />
        </FlexItem>

        <FlexItem>
          {activeDeployments.length === 0 ? (
            <EmptyState>
              <RocketIcon style={{ fontSize: '3rem', color: '#9ca3af' }} />
              <Title headingLevel="h2" size="lg">No deployed features yet</Title>
              <EmptyStateBody>
                Open Early Access Overview, explore a feature, and choose Experience It to deploy a sandbox.
              </EmptyStateBody>
              <EmptyStateFooter>
                <Button variant="primary" onClick={() => navigate('/early-access')}>
                  Browse Early Access
                </Button>
              </EmptyStateFooter>
            </EmptyState>
          ) : (
            <Gallery hasGutter minWidths={{ default: '300px' }} maxWidths={{ default: '1fr' }} style={{ padding: '3px' }}>
              {activeDeployments.map((deployment) => {
                const feature = getEarlyAccessFeatureById(deployment.featureId);
                if (!feature) return null;
                return (
                  <GalleryItem key={deployment.featureId}>
                    <Card
                      isFullHeight
                      style={{ borderTop: `3px solid ${feature.color}`, cursor: 'pointer' }}
                      onClick={() => navigate(`/early-access/deployed/${feature.id}`)}
                    >
                      <CardHeader>
                        <CardTitle>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                            <FlexItem>
                              <span style={{ fontSize: '1.5rem' }}>{feature.icon}</span>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <span style={{ fontWeight: 600 }}>{feature.name}</span>
                            </FlexItem>
                            <FlexItem>
                              <Label color={feature.badgeColor} isCompact>{feature.badgeLabel}</Label>
                            </FlexItem>
                          </Flex>
                        </CardTitle>
                      </CardHeader>
                      <CardBody>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 8px' }}>
                          {feature.description}
                        </p>
                        <Flex gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
                          <Label color={statusColor(deployment.status)} isCompact>
                            {deployment.status}
                          </Label>
                          {deployment.canvasProjectName && (
                            <Label isCompact>Canvas: {deployment.canvasProjectName}</Label>
                          )}
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
                            navigate(`/early-access/deployed/${feature.id}`);
                          }}
                        >
                          Open sandbox
                        </Button>
                      </CardFooter>
                    </Card>
                  </GalleryItem>
                );
              })}
            </Gallery>
          )}
        </FlexItem>

        {activeDeployments.length > 0 && (
          <FlexItem>
            <Content>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.8rem' }}>
                {EARLY_ACCESS_FEATURES.length - activeDeployments.length} other Early Access features available to experience.
              </p>
            </Content>
          </FlexItem>
        )}
      </Flex>
    </PageSection>
  );
};

export { EarlyAccessDeployed };
