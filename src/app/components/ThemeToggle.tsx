import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { MoonIcon, SunIcon } from '@patternfly/react-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'plain' | 'link' | 'primary' | 'secondary';
  showLabel?: boolean;
}

export const ThemeToggle: React.FunctionComponent<ThemeToggleProps> = ({
  variant = 'plain',
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const buttonContent = (
    <Button
      variant={variant}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      icon={isDark ? <SunIcon /> : <MoonIcon />}
    >
      {showLabel && (isDark ? 'Light Mode' : 'Dark Mode')}
    </Button>
  );

  if (showLabel) {
    return buttonContent;
  }

  return (
    <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {buttonContent}
    </Tooltip>
  );
};
