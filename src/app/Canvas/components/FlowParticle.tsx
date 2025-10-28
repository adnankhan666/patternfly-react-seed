import * as React from 'react';

interface FlowParticleProps {
  x: number;
  y: number;
  direction: 'forward' | 'backward';
}

export const FlowParticle: React.FunctionComponent<FlowParticleProps> = React.memo(({
  x,
  y,
  direction,
}) => {
  const color = direction === 'forward' ? '#10b981' : '#f59e0b';

  return (
    <circle
      cx={x}
      cy={y}
      r="5"
      fill={color}
      opacity="0.7"
    />
  );
});

FlowParticle.displayName = 'FlowParticle';
