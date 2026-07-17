import * as React from 'react';
import {
  PageSection,
  Title,
  Gallery,
  GalleryItem,
  Label,
  Flex,
  FlexItem,
  Content,
  Alert,
  AlertActionCloseButton,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  DrawerHead,
  DrawerActions,
  DrawerCloseButton,
  SearchInput,
  Button,
  Divider,
} from '@patternfly/react-core';
import { FlaskIcon, StarIcon } from '@patternfly/react-icons';
import { FeatureFlipCard } from '../CommunityPlugins/FeatureFlipCard';
import { FeatureDetailDrawer } from '../CommunityPlugins/FeatureDetailDrawer';
import { EARLY_ACCESS_FEATURES } from '../../data/previewFeatures';
import {
  getInterestCount,
  hasVoted,
  toggleVote,
  getStarredFeatureIds,
  toggleStar,
  isStarred,
  FEATURE_STARRED_EVENT,
} from '../../data/featureInterestStore';
import { EarlyAccessBreadcrumb } from './EarlyAccessBreadcrumb';

const CATEGORIES = ['AI/ML', 'Infrastructure', 'Data Management'] as const;

const EarlyAccessOverview: React.FunctionComponent = () => {
  const [flippedId, setFlippedId] = React.useState<string | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = React.useState<string | null>(null);
  const [interestVersion, setInterestVersion] = React.useState(0);
  const [starVersion, setStarVersion] = React.useState(0);
  const [feedbackNotice, setFeedbackNotice] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);

  const selectedFeature = EARLY_ACCESS_FEATURES.find((f) => f.id === selectedFeatureId) ?? null;

  React.useEffect(() => {
    const refresh = () => setStarVersion((v) => v + 1);
    window.addEventListener(FEATURE_STARRED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(FEATURE_STARRED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const bumpInterest = React.useCallback(() => {
    setInterestVersion((v) => v + 1);
  }, []);

  const starredIds = React.useMemo(() => {
    void starVersion;
    return new Set(getStarredFeatureIds());
  }, [starVersion]);

  const filteredFeatures = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return EARLY_ACCESS_FEATURES.filter((feature) => {
      if (activeCategory && feature.category !== activeCategory) return false;
      if (showFavoritesOnly && !starredIds.has(feature.id)) return false;
      if (!query) return true;
      return (
        feature.name.toLowerCase().includes(query) ||
        feature.description.toLowerCase().includes(query) ||
        feature.category.toLowerCase().includes(query) ||
        feature.badgeLabel.toLowerCase().includes(query)
      );
    });
  }, [search, activeCategory, showFavoritesOnly, starredIds]);

  const favoriteFeatures = React.useMemo(
    () => EARLY_ACCESS_FEATURES.filter((f) => starredIds.has(f.id)),
    [starredIds]
  );

  const handleQuickVote = (featureId: string, featureName: string) => {
    const next = toggleVote(featureId);
    bumpInterest();
    setFeedbackNotice(
      next.voted
        ? `Interest recorded for ${featureName}`
        : `Interest removed for ${featureName}`
    );
  };

  const handleToggleStar = (featureId: string, featureName: string) => {
    const next = toggleStar(featureId);
    setStarVersion((v) => v + 1);
    setFeedbackNotice(
      next ? `${featureName} added to Favorites` : `${featureName} removed from Favorites`
    );
  };

  const handleExplore = (featureId: string) => {
    setSelectedFeatureId(featureId);
    setFlippedId(null);
  };

  const renderGallery = (features: typeof EARLY_ACCESS_FEATURES) => (
    <Gallery hasGutter minWidths={{ default: '340px' }} maxWidths={{ default: '1fr' }}>
      {features.map((feature) => {
        const count =
          interestVersion >= 0
            ? getInterestCount(feature.id, feature.baseInterestCount)
            : feature.baseInterestCount;
        const voted = interestVersion >= 0 && hasVoted(feature.id);
        const starred = starVersion >= 0 && isStarred(feature.id);
        return (
          <GalleryItem key={feature.id}>
            <FeatureFlipCard
              feature={feature}
              isFlipped={flippedId === feature.id}
              onFlip={() => setFlippedId((prev) => (prev === feature.id ? null : feature.id))}
              onExplore={() => handleExplore(feature.id)}
              onQuickVote={() => handleQuickVote(feature.id, feature.name)}
              onToggleStar={() => handleToggleStar(feature.id, feature.name)}
              interestCount={count}
              hasVoted={voted}
              isStarred={starred}
            />
          </GalleryItem>
        );
      })}
    </Gallery>
  );

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
          allFeatures={EARLY_ACCESS_FEATURES}
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
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div>
                <EarlyAccessBreadcrumb items={[{ label: 'Overview' }]} />
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <FlexItem>
                    <Title headingLevel="h1" size="xl">
                      <FlaskIcon style={{ marginRight: '8px', color: '#f59e0b' }} />
                      Early Access
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <Label color="orange" isCompact>DP</Label>
                  </FlexItem>
                  <FlexItem>
                    <Label color="purple" isCompact>TP</Label>
                  </FlexItem>
                </Flex>
                <Content>
                  <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '0.9rem' }}>
                    Explore developer and technical preview features, star your favorites, and experience them in a sandbox
                  </p>
                </Content>
              </div>

              {feedbackNotice && (
                <div style={{ marginTop: 12 }}>
                  <Alert
                    variant="success"
                    title={feedbackNotice}
                    actionClose={<AlertActionCloseButton onClose={() => setFeedbackNotice(null)} />}
                    isInline
                  >
                    Open Explore Feature to add priority, use cases, and detailed feedback.
                  </Alert>
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <Flex
                  gap={{ default: 'gapSm' }}
                  alignItems={{ default: 'alignItemsCenter' }}
                  flexWrap={{ default: 'wrap' }}
                >
                  <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: '200px', maxWidth: '360px' }}>
                    <SearchInput
                      placeholder="Search features..."
                      value={search}
                      onChange={(_e, value) => setSearch(value)}
                      onClear={() => setSearch('')}
                      aria-label="Search early access features"
                    />
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant={showFavoritesOnly ? 'primary' : 'secondary'}
                      icon={<StarIcon />}
                      onClick={() => setShowFavoritesOnly((v) => !v)}
                    >
                      Favorites
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant={activeCategory === null ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setActiveCategory(null)}
                    >
                      All
                    </Button>
                  </FlexItem>
                  {CATEGORIES.map((cat) => (
                    <FlexItem key={cat}>
                      <Button
                        variant={activeCategory === cat ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setActiveCategory((prev) => (prev === cat ? null : cat))}
                      >
                        {cat}
                      </Button>
                    </FlexItem>
                  ))}
                </Flex>
              </div>

              {!showFavoritesOnly && favoriteFeatures.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Title headingLevel="h2" size="md" style={{ marginBottom: '6px' }}>
                    <StarIcon style={{ marginRight: '6px', color: '#f59e0b' }} />
                    Favorites
                  </Title>
                  {renderGallery(favoriteFeatures)}
                </div>
              )}

              {!showFavoritesOnly && favoriteFeatures.length > 0 && (
                <Divider style={{ margin: '16px 0' }} />
              )}

              <div style={{ marginTop: !showFavoritesOnly && favoriteFeatures.length > 0 ? 0 : 16 }}>
                <Title headingLevel="h2" size="md" style={{ marginBottom: '4px' }}>
                  {showFavoritesOnly ? 'Favorites' : 'All Features'}
                </Title>
                <Content>
                  <p style={{ color: '#6b7280', margin: '0 0 8px', fontSize: '0.875rem' }}>
                    Click a card to flip it, star favorites, explore details, or Experience It in a sandbox
                  </p>
                </Content>
                {filteredFeatures.length === 0 ? (
                  <Alert variant="info" isInline title="No features match your filters">
                    Clear search or category filters to see more early access features.
                  </Alert>
                ) : (
                  renderGallery(filteredFeatures)
                )}
              </div>
            </div>
          </PageSection>
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export { EarlyAccessOverview };
