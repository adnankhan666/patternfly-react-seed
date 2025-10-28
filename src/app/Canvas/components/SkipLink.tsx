import * as React from 'react';

interface SkipLinkProps {
  /** Target element ID to skip to */
  targetId: string;
  /** Link text */
  children: React.ReactNode;
}

/**
 * Skip link component for keyboard accessibility
 * Allows users to skip directly to main content
 */
export const SkipLink: React.FunctionComponent<SkipLinkProps> = React.memo(({ targetId, children }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      className="skip-to-content"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleClick(e as any);
        }
      }}
    >
      {children}
    </a>
  );
});

SkipLink.displayName = 'SkipLink';
