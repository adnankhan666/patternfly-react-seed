import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Button,
  Divider,
  Flex,
  FlexItem,
  Label,
  Title,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import {
  FeatureFlipCardData,
  formatRelativeDate,
  getMaturityIndex,
  MATURITY_STAGES,
} from '../../data/previewFeatures';
import { FeatureMockupPreview } from './FeatureMockupPreview';
import { FeatureFeedbackPanel } from './FeatureFeedbackPanel';
import './FeatureDetailDrawer.css';

interface FeatureDetailDrawerProps {
  feature: FeatureFlipCardData;
  allFeatures: FeatureFlipCardData[];
  onSelectRelated: (featureId: string) => void;
  onInterestChange?: () => void;
}

const FeatureDetailDrawer: React.FunctionComponent<FeatureDetailDrawerProps> = ({
  feature,
  allFeatures,
  onSelectRelated,
  onInterestChange,
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = React.useState<string | null>(
    feature.keyCapabilities[0] ? `${feature.id}-cap-0` : null
  );
  const maturityIndex = getMaturityIndex(feature.maturityStage);

  React.useEffect(() => {
    setExpanded(feature.keyCapabilities[0] ? `${feature.id}-cap-0` : null);
  }, [feature.id, feature.keyCapabilities]);

  const related = feature.relatedFeatureIds
    .map((id) => allFeatures.find((f) => f.id === id))
    .filter((f): f is FeatureFlipCardData => Boolean(f));

  return (
    <div className="feature-detail-drawer">
      {/* Hero */}
      <div className="feature-detail-drawer__hero" style={{ borderTopColor: feature.color }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <span className="feature-detail-drawer__icon">{feature.icon}</span>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
              <Title headingLevel="h2" size="xl">{feature.name}</Title>
              <Label color={feature.badgeColor} isCompact>{feature.badgeLabel}</Label>
              <Label isCompact>{feature.category}</Label>
            </Flex>
            <p className="feature-detail-drawer__desc">{feature.description}</p>
            <p className="feature-detail-drawer__updated">
              Last updated: {formatRelativeDate(feature.lastUpdated)}
            </p>
          </FlexItem>
        </Flex>

        <div className="feature-detail-drawer__maturity" aria-label="Maturity stage">
          {MATURITY_STAGES.map((stage, index) => {
            const isActive = index === maturityIndex;
            const isPast = index < maturityIndex;
            return (
              <React.Fragment key={stage.id}>
                {index > 0 && (
                  <div
                    className={`feature-detail-drawer__maturity-line${isPast || isActive ? ' is-filled' : ''}`}
                    style={isPast || isActive ? { background: feature.color } : undefined}
                  />
                )}
                <div className="feature-detail-drawer__maturity-step">
                  <div
                    className={`feature-detail-drawer__maturity-dot${isActive ? ' is-active' : ''}${isPast ? ' is-past' : ''}`}
                    style={
                      isActive || isPast
                        ? { background: feature.color, borderColor: feature.color }
                        : undefined
                    }
                  />
                  <span className={isActive ? 'is-active-label' : undefined}>{stage.label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <Divider />

      {/* Interactive Preview */}
      <section className="feature-detail-drawer__section">
        <Title headingLevel="h3" size="md" style={{ marginBottom: '8px' }}>Interactive preview</Title>
        <FeatureMockupPreview
          type={feature.mockupType}
          color={feature.color}
          size="lg"
          label="Animated preview"
        />
        <Button
          variant="secondary"
          icon={<ExternalLinkAltIcon />}
          onClick={() => navigate(`/early-access/deployed/${feature.id}`)}
        >
          Experience It
        </Button>
      </section>

      <Divider />

      {/* Key Capabilities */}
      <section className="feature-detail-drawer__section">
        <Title headingLevel="h3" size="md" style={{ marginBottom: '8px' }}>Key capabilities</Title>
        <Accordion isBordered>
          {feature.keyCapabilities.map((cap, index) => {
            const id = `${feature.id}-cap-${index}`;
            return (
              <AccordionItem key={id} isExpanded={expanded === id}>
                <AccordionToggle
                  id={id}
                  onClick={() => setExpanded((prev) => (prev === id ? null : id))}
                >
                  {cap.title}
                </AccordionToggle>
                <AccordionContent id={`${id}-content`}>
                  {cap.description}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>

      <Divider />

      {/* Use Cases */}
      <section className="feature-detail-drawer__section">
        <Title headingLevel="h3" size="md" style={{ marginBottom: '8px' }}>How teams use this</Title>
        <ul className="feature-detail-drawer__list">
          {feature.useCases.map((uc) => (
            <li key={uc}>{uc}</li>
          ))}
        </ul>
      </section>

      <Divider />

      {/* Timeline & Updates */}
      <section className="feature-detail-drawer__section">
        <Title headingLevel="h3" size="md" style={{ marginBottom: '8px' }}>Timeline &amp; updates</Title>
        <p className="feature-detail-drawer__timeline">
          Expected availability: <strong>{feature.expectedTimeline}</strong>
        </p>
        <div className="feature-detail-drawer__changelog">
          {feature.changelogEntries.map((entry) => (
            <div key={`${entry.date}-${entry.text}`} className="feature-detail-drawer__changelog-item">
              <span className="feature-detail-drawer__changelog-date">{entry.date}</span>
              <span>{entry.text}</span>
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <>
          <Divider />
          <section className="feature-detail-drawer__section">
            <Title headingLevel="h3" size="md" style={{ marginBottom: '8px' }}>Related features</Title>
            <div className="feature-detail-drawer__related">
              {related.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  className="feature-detail-drawer__related-card"
                  style={{ borderTopColor: rel.color }}
                  onClick={() => onSelectRelated(rel.id)}
                >
                  <span className="feature-detail-drawer__related-icon">{rel.icon}</span>
                  <span className="feature-detail-drawer__related-name">{rel.name}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      <Divider />

      <section className="feature-detail-drawer__section">
        <FeatureFeedbackPanel feature={feature} onInterestChange={onInterestChange} />
      </section>
    </div>
  );
};

export { FeatureDetailDrawer };
