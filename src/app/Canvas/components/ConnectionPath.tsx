import * as React from 'react';

interface ConnectionPathProps {
  pathData: string;
  isActive: boolean;
  onDelete: (e: React.MouseEvent) => void;
}

export const ConnectionPath: React.FunctionComponent<ConnectionPathProps> = React.memo(({
  pathData,
  isActive,
  onDelete,
}) => {
  return (
    <g>
      {/* Invisible wider path for easier clicking */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
        onClick={onDelete}
      />
      {/* Visible connection path */}
      <path
        d={pathData}
        stroke={isActive ? '#3b82f6' : '#6b7280'}
        strokeWidth={isActive ? '3' : '2'}
        fill="none"
        markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
        style={{
          pointerEvents: 'none',
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease'
        }}
        className={isActive ? 'connection-active' : ''}
      />
    </g>
  );
});

ConnectionPath.displayName = 'ConnectionPath';
