import * as React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardFooter,
  Button,
  Flex,
  FlexItem,
  Label,
} from '@patternfly/react-core';
import { CheckIcon, StarIcon, ThumbsUpIcon } from '@patternfly/react-icons';
import {
  FeatureFlipCardData,
  getMaturityIndex,
  MATURITY_STAGES,
} from '../../data/previewFeatures';
import { FeatureMockupPreview } from './FeatureMockupPreview';
import './FeatureFlipCard.css';

export type { FeatureFlipCardData };

interface FeatureFlipCardProps {
  feature: FeatureFlipCardData;
  isFlipped: boolean;
  onFlip: () => void;
  onExplore: () => void;
  onQuickVote: () => void;
  onToggleStar?: () => void;
  interestCount: number;
  hasVoted: boolean;
  isStarred?: boolean;
}

const MaturityDots: React.FunctionComponent<{ stage: FeatureFlipCardData['maturityStage']; color: string }> = ({
  stage,
  color,
}) => {
  const activeIndex = getMaturityIndex(stage);
  return (
    <div className="feature-flip-card__maturity" aria-label={`Maturity: ${MATURITY_STAGES[activeIndex]?.label}`}>
      {MATURITY_STAGES.map((s, index) => {
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;
        return (
          <span
            key={s.id}
            className={`feature-flip-card__maturity-dot${isActive ? ' is-active' : ''}${isPast ? ' is-past' : ''}`}
            style={isActive || isPast ? { background: color, borderColor: color } : undefined}
            title={s.label}
          />
        );
      })}
    </div>
  );
};

const MetricsStrip: React.FunctionComponent<{
  feature: FeatureFlipCardData;
  interestCount: number;
}> = ({ feature, interestCount }) => {
  const { metrics, expectedTimeline } = feature;
  const shortTimeline = expectedTimeline.replace(' 20', "'");
  return (
    <div className="feature-flip-card__metrics" aria-label="Feature metrics">
      <div className="feature-flip-card__metrics-row">
        <span title="Community interest">{interestCount} interested</span>
        <span title="Expected availability">{shortTimeline}</span>
      </div>
      <div className="feature-flip-card__metrics-row">
        <span title="Active deployments">{metrics.adoptionCount} deployed</span>
        <span title="Compatibility score">{metrics.compatScore}% compat</span>
      </div>
      <div className="feature-flip-card__metrics-row">
        <span title="Latency benchmark">~{metrics.perfLatencyMs}ms</span>
        <span title="Throughput">{metrics.perfThroughput}</span>
      </div>
      <div className="feature-flip-card__metrics-platforms">
        {metrics.compatPlatforms.slice(0, 3).map((p) => (
          <Label key={p} isCompact>{p}</Label>
        ))}
      </div>
    </div>
  );
};

const FeatureFlipCard: React.FunctionComponent<FeatureFlipCardProps> = ({
  feature,
  isFlipped,
  onFlip,
  onExplore,
  onQuickVote,
  onToggleStar,
  interestCount,
  hasVoted,
  isStarred = false,
}) => (
  <div
    className={`feature-flip-card${isFlipped ? ' is-flipped' : ''}`}
    onClick={onFlip}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onFlip();
      }
    }}
    role="button"
    tabIndex={0}
    aria-pressed={isFlipped}
    aria-label={`${feature.name} feature card`}
  >
    <div className="feature-flip-card__inner">
      <div className="feature-flip-card__face feature-flip-card__face--front">
        <Card
          isCompact
          isFullHeight
          style={{ height: '100%', borderTop: `3px solid ${feature.color}` }}
        >
          <CardHeader>
            <CardTitle>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                <FlexItem>
                  <span style={{ fontSize: '1.5rem' }}>{feature.icon}</span>
                </FlexItem>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{feature.name}</span>
                </FlexItem>
                <FlexItem>
                  <Label color={feature.badgeColor} isCompact>{feature.badgeLabel}</Label>
                </FlexItem>
                {onToggleStar && (
                  <FlexItem>
                    <button
                      type="button"
                      className={`feature-flip-card__star${isStarred ? ' is-starred' : ''}`}
                      aria-label={isStarred ? `Unstar ${feature.name}` : `Star ${feature.name}`}
                      aria-pressed={isStarred}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar();
                      }}
                    >
                      <StarIcon />
                    </button>
                  </FlexItem>
                )}
              </Flex>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <MaturityDots stage={feature.maturityStage} color={feature.color} />
            <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '8px 0 6px' }}>
              {feature.description}
            </p>
            <Label isCompact className="feature-flip-card__category">{feature.category}</Label>
            <MetricsStrip feature={feature} interestCount={interestCount} />
          </CardBody>
          <CardFooter>
            <span className={`feature-flip-card__interest${hasVoted ? ' is-voted' : ''}`}>
              <ThumbsUpIcon />
              {hasVoted ? 'You voted' : `${interestCount} interested`}
            </span>
            <span className="feature-flip-card__hint">Click to preview</span>
          </CardFooter>
        </Card>
      </div>

      <div className="feature-flip-card__face feature-flip-card__face--back">
        <Card
          isCompact
          isFullHeight
          style={{ height: '100%', borderTop: `3px solid ${feature.color}`, background: '#fafafa' }}
        >
          <CardHeader>
            <CardTitle>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{feature.name}</span>
                </FlexItem>
                <FlexItem>
                  <Label color={feature.badgeColor} isCompact>{feature.badgeLabel}</Label>
                </FlexItem>
              </Flex>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <FeatureMockupPreview type={feature.mockupType} color={feature.color} size="sm" />
            <ul className="feature-flip-card__highlights">
              {feature.highlights.map((item) => (
                <li key={item}>
                  <CheckIcon className="feature-flip-card__check" style={{ color: feature.color }} />
                  {item}
                </li>
              ))}
            </ul>
            <Flex gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
              <FlexItem>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExplore();
                  }}
                >
                  Explore Feature
                </Button>
              </FlexItem>
              <FlexItem>
                <Button
                  variant={hasVoted ? 'secondary' : 'tertiary'}
                  size="sm"
                  icon={<ThumbsUpIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickVote();
                  }}
                >
                  {hasVoted ? 'Voted' : 'Interested'}
                </Button>
              </FlexItem>
            </Flex>
          </CardBody>
        </Card>
      </div>
    </div>
  </div>
);

export { FeatureFlipCard };
