import * as React from 'react';
import { MockupType } from '../../data/previewFeatures';
import './FeatureMockupPreview.css';

interface FeatureMockupPreviewProps {
  type: MockupType;
  color: string;
  size?: 'sm' | 'lg';
  label?: string;
}

const ArchitectureMockup: React.FunctionComponent<{ color: string }> = ({ color }) => (
  <div className="feature-mockup feature-mockup--architecture" style={{ ['--mock-accent' as string]: color }}>
    <svg className="feature-mockup__svg" viewBox="0 0 280 120" aria-hidden="true">
      <line className="feature-mockup__line feature-mockup__line--1" x1="50" y1="35" x2="120" y2="60" />
      <line className="feature-mockup__line feature-mockup__line--2" x1="50" y1="85" x2="120" y2="60" />
      <line className="feature-mockup__line feature-mockup__line--3" x1="160" y1="60" x2="230" y2="35" />
      <line className="feature-mockup__line feature-mockup__line--4" x1="160" y1="60" x2="230" y2="85" />
    </svg>
    <div className="feature-mockup__node feature-mockup__node--1">Ingest</div>
    <div className="feature-mockup__node feature-mockup__node--2">Store</div>
    <div className="feature-mockup__node feature-mockup__node--3">Core</div>
    <div className="feature-mockup__node feature-mockup__node--4">Serve</div>
    <div className="feature-mockup__node feature-mockup__node--5">Observe</div>
  </div>
);

const WorkflowMockup: React.FunctionComponent<{ color: string }> = ({ color }) => (
  <div className="feature-mockup feature-mockup--workflow" style={{ ['--mock-accent' as string]: color }}>
    <div className="feature-mockup__step feature-mockup__step--1">Prepare</div>
    <div className="feature-mockup__arrow feature-mockup__arrow--1" />
    <div className="feature-mockup__step feature-mockup__step--2">Train</div>
    <div className="feature-mockup__arrow feature-mockup__arrow--2" />
    <div className="feature-mockup__step feature-mockup__step--3">Eval</div>
    <div className="feature-mockup__arrow feature-mockup__arrow--3" />
    <div className="feature-mockup__step feature-mockup__step--4">Deploy</div>
  </div>
);

const UiMockup: React.FunctionComponent<{ color: string }> = ({ color }) => (
  <div className="feature-mockup feature-mockup--ui" style={{ ['--mock-accent' as string]: color }}>
    <div className="feature-mockup__chrome">
      <span />
      <span />
      <span />
    </div>
    <div className="feature-mockup__ui-body">
      <div className="feature-mockup__skeleton feature-mockup__skeleton--title" />
      <div className="feature-mockup__skeleton feature-mockup__skeleton--line" />
      <div className="feature-mockup__skeleton feature-mockup__skeleton--line short" />
      <div className="feature-mockup__ui-grid">
        <div className="feature-mockup__panel feature-mockup__panel--1" />
        <div className="feature-mockup__panel feature-mockup__panel--2" />
        <div className="feature-mockup__panel feature-mockup__panel--3" />
      </div>
    </div>
    <div className="feature-mockup__shimmer" aria-hidden="true" />
  </div>
);

const FeatureMockupPreview: React.FunctionComponent<FeatureMockupPreviewProps> = ({
  type,
  color,
  size = 'sm',
  label,
}) => (
  <div className={`feature-mockup-preview feature-mockup-preview--${size}`}>
    {type === 'architecture' && <ArchitectureMockup color={color} />}
    {type === 'workflow' && <WorkflowMockup color={color} />}
    {type === 'ui-mockup' && <UiMockup color={color} />}
    {label && <span className="feature-mockup-preview__label">{label}</span>}
  </div>
);

export { FeatureMockupPreview };
