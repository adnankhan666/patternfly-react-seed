import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PageSection,
  Title,
  Gallery,
  GalleryItem,
  Label,
  Flex,
  FlexItem,
  Content,
  Tabs,
  Tab,
  TabTitleText,
  Alert,
  AlertActionCloseButton,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  DrawerHead,
  DrawerActions,
  DrawerCloseButton,
} from '@patternfly/react-core';
import {
  FlaskIcon,
  CheckCircleIcon,
} from '@patternfly/react-icons';
import { PluginBrowseSection } from './PluginBrowseSection';
import { CommunityPluginsBreadcrumb } from './CommunityPluginsBreadcrumb';
import { FeatureFlipCard } from './FeatureFlipCard';
import { FeatureDetailDrawer } from './FeatureDetailDrawer';
import { DEVELOPER_PREVIEW_FEATURES } from '../../data/previewFeatures';
import {
  getInterestCount,
  hasVoted,
  toggleVote,
} from '../../data/featureInterestStore';

const PREVIEW_FEATURES = DEVELOPER_PREVIEW_FEATURES;

const DeveloperPreviewPage: React.FunctionComponent = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<string | number>(
    searchParams.get('tab') === 'plugins' ? 1 : 0
  );
  const [flippedId, setFlippedId] = React.useState<string | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = React.useState<string | null>(null);
  const [interestVersion, setInterestVersion] = React.useState(0);
  const [feedbackNotice, setFeedbackNotice] = React.useState<string | null>(null);

  const selectedFeature = PREVIEW_FEATURES.find((f) => f.id === selectedFeatureId) ?? null;

  const bumpInterest = React.useCallback(() => {
    setInterestVersion((v) => v + 1);
  }, []);

  const handleQuickVote = (featureId: string, featureName: string) => {
    const next = toggleVote(featureId);
    bumpInterest();
    setFeedbackNotice(
      next.voted
        ? `Interest recorded for ${featureName}`
        : `Interest removed for ${featureName}`
    );
  };

  const handleExplore = (featureId: string) => {
    setSelectedFeatureId(featureId);
    setFlippedId(null);
  };

  const panelContent = selectedFeature ? (
    <DrawerPanelContent defaultSize="420px" minSize="320px" isResizable>
      <DrawerHead>
        <span className="pf-v6-c-drawer__title" style={{ fontWeight: 600 }}>
          Feature details
        </span>
        <DrawerActions>
          <DrawerCloseButton onClick={() => setSelectedFeatureId(null)} />
        </DrawerActions>
      </DrawerHead>
      <DrawerContentBody>
        <FeatureDetailDrawer
          feature={selectedFeature}
          allFeatures={PREVIEW_FEATURES}
          onSelectRelated={(id) => setSelectedFeatureId(id)}
          onInterestChange={bumpInterest}
        />
      </DrawerContentBody>
    </DrawerPanelContent>
  ) : undefined;

  return (
    <Drawer
      isExpanded={Boolean(selectedFeature)}
      position="end"
      onExpand={() => undefined}
    >
      <DrawerContent panelContent={panelContent}>
        <DrawerContentBody>
          <PageSection hasBodyWrapper={false} style={{ paddingTop: '16px', paddingBottom: '16px' }}>
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
              <FlexItem>
                <CommunityPluginsBreadcrumb items={[{ label: 'Developer Preview' }]} />
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <FlexItem>
                    <Title headingLevel="h1" size="xl">
                      <FlaskIcon style={{ marginRight: '8px', color: '#f59e0b' }} />
                      Developer Preview
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <Label color="orange" isCompact>DP</Label>
                  </FlexItem>
                </Flex>
                <Content>
                  <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '0.9rem' }}>
                    Explore upcoming capabilities, try related experiences, and share your interest
                  </p>
                </Content>
              </FlexItem>

              {feedbackNotice && (
                <FlexItem>
                  <Alert
                    variant="success"
                    title={feedbackNotice}
                    actionClose={<AlertActionCloseButton onClose={() => setFeedbackNotice(null)} />}
                    isInline
                  >
                    Open Explore Feature to add priority, use cases, and detailed feedback.
                  </Alert>
                </FlexItem>
              )}

              <FlexItem>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(_event, tabIndex) => setActiveTab(tabIndex)}
                  aria-label="Developer preview tabs"
                >
                  <Tab eventKey={0} title={<TabTitleText>Upcoming Features</TabTitleText>}>
                    <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }} style={{ marginTop: '12px' }}>
                      <FlexItem>
                        <Content>
                          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
                            Click a card to flip it, then explore the feature or register interest
                          </p>
                        </Content>
                      </FlexItem>
                      <FlexItem>
                        <Gallery hasGutter minWidths={{ default: '260px' }} maxWidths={{ default: '1fr' }}>
                          {PREVIEW_FEATURES.map((feature) => {
                            // interestVersion re-reads localStorage after votes
                            const count = interestVersion >= 0
                              ? getInterestCount(feature.id, feature.baseInterestCount)
                              : feature.baseInterestCount;
                            const voted = interestVersion >= 0 && hasVoted(feature.id);
                            return (
                              <GalleryItem key={feature.id}>
                                <FeatureFlipCard
                                  feature={feature}
                                  isFlipped={flippedId === feature.id}
                                  onFlip={() => setFlippedId((prev) => (prev === feature.id ? null : feature.id))}
                                  onExplore={() => handleExplore(feature.id)}
                                  onQuickVote={() => handleQuickVote(feature.id, feature.name)}
                                  interestCount={count}
                                  hasVoted={voted}
                                />
                              </GalleryItem>
                            );
                          })}
                        </Gallery>
                      </FlexItem>
                    </Flex>
                  </Tab>
                  <Tab eventKey={1} title={<TabTitleText><CheckCircleIcon style={{ marginRight: '6px' }} />Deployed Plugins</TabTitleText>}>
                    <div style={{ marginTop: '12px' }}>
                      <PluginBrowseSection showSectionHeader={false} deployedOnly />
                    </div>
                  </Tab>
                </Tabs>
              </FlexItem>
            </Flex>
          </PageSection>
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export { DeveloperPreviewPage };
