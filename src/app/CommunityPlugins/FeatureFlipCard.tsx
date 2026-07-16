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
import './FeatureFlipCard.css';

export interface FeatureFlipCardData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  highlights: string[];
  badgeLabel: string;
  badgeColor: 'orange' | 'purple' | 'blue' | 'green' | 'cyan' | 'red' | 'grey';
}

interface FeatureFlipCardProps {
  feature: FeatureFlipCardData;
  isFlipped: boolean;
  onFlip: () => void;
  onRequestAccess: () => void;
}

const FeatureFlipCard: React.FunctionComponent<FeatureFlipCardProps> = ({
  feature,
  isFlipped,
  onFlip,
  onRequestAccess,
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
              </Flex>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>
              {feature.description}
            </p>
          </CardBody>
          <CardFooter>
            <span className="feature-flip-card__hint">Click to preview · Coming soon</span>
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
            <div className="feature-flip-card__mockup">Preview coming soon</div>
            <ul className="feature-flip-card__highlights">
              {feature.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRequestAccess();
              }}
            >
              Request Early Access
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  </div>
);

export { FeatureFlipCard };
