import * as React from 'react';
import './SkeletonLoader.css';

/**
 * Skeleton loader component for ChatBot message loading states
 * Displays animated placeholder bubbles with shimmer effect
 */

interface SkeletonLoaderProps {
  /** Number of skeleton lines to display (default: 3) */
  lines?: number;
  /** Width variant for skeleton bubbles (default: 'medium') */
  variant?: 'short' | 'medium' | 'long';
}

export const SkeletonLoader: React.FunctionComponent<SkeletonLoaderProps> = React.memo(({
  lines = 3,
  variant = 'medium',
}) => {
  const getWidth = (index: number): string => {
    // Vary widths to make it look more realistic
    const widths = {
      short: ['60%', '55%', '50%'],
      medium: ['75%', '70%', '65%'],
      long: ['85%', '80%', '75%'],
    };

    return widths[variant][index % 3];
  };

  return (
    <div className="skeleton-loader">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="skeleton-line"
          style={{ width: getWidth(index) }}
        >
          <div className="skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
});

SkeletonLoader.displayName = 'SkeletonLoader';
