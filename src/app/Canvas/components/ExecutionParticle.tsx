import * as React from 'react';

interface ExecutionParticleProps {
  x: number;
  y: number;
}

export const ExecutionParticle: React.FunctionComponent<ExecutionParticleProps> = React.memo(({
  x,
  y,
}) => {
  return (
    <g>
      {/* Particle glow effect */}
      <circle
        cx={x}
        cy={y}
        r="12"
        fill="#3b82f6"
        opacity="0.3"
      />
      {/* Main particle */}
      <circle
        cx={x}
        cy={y}
        r="6"
        fill="#3b82f6"
        className="flow-particle"
      />
    </g>
  );
});

ExecutionParticle.displayName = 'ExecutionParticle';
