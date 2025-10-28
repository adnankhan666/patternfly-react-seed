import * as React from 'react';
import './LoadingSpinner.css';

/**
 * Loading spinner component for workflow execution states
 * Displays animated spinner with optional message
 */

interface LoadingSpinnerProps {
  /** Loading message to display below spinner */
  message?: string;
  /** Size of the spinner (default: 'medium') */
  size?: 'small' | 'medium' | 'large';
  /** Show progress percentage (0-100) */
  progress?: number;
}

export const LoadingSpinner: React.FunctionComponent<LoadingSpinnerProps> = React.memo(({
  message = 'Loading...',
  size = 'medium',
  progress,
}) => {
  const sizeMap = {
    small: 24,
    medium: 48,
    large: 72,
  };

  const spinnerSize = sizeMap[size];

  const progressValue = progress !== undefined ? Math.round(progress) : undefined;
  const ariaLabel = progressValue !== undefined
    ? `Loading ${progressValue}% complete`
    : message || 'Loading';

  return (
    <div className="loading-spinner-container" role="status" aria-live="polite" aria-label={ariaLabel}>
      <div className={`loading-spinner loading-spinner-${size}`}>
        {/* Outer ring */}
        <svg
          width={spinnerSize}
          height={spinnerSize}
          viewBox="0 0 50 50"
          className="spinner-svg"
          role="img"
          aria-label={progressValue !== undefined ? `Progress: ${progressValue}%` : 'Loading spinner'}
        >
          <circle
            className="spinner-track"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4"
            aria-hidden="true"
          />
          <circle
            className="spinner-head"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4"
            strokeDasharray={progress !== undefined ? `${(progress / 100) * 125.6}, 125.6` : '80, 200'}
            strokeDashoffset="0"
            aria-hidden="true"
          />
        </svg>
        {progress !== undefined && (
          <div className="spinner-progress" aria-hidden="true">
            <span className="spinner-progress-text">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
      {message && (
        <div className="loading-message" aria-live="polite">{message}</div>
      )}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
