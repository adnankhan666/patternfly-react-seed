import * as React from 'react';
import {
  Button,
  Flex,
  FlexItem,
  Title,
  Label,
} from '@patternfly/react-core';
import { useSidebar } from '../contexts/SidebarContext';
import './GuidedTour.css';

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'right' | 'left' | 'bottom' | 'top';
}

const TOUR_VERSION = 'v12';
const TOUR_STORAGE_KEY = `tourCompleted-${TOUR_VERSION}`;

const TOUR_STEPS: TourStep[] = [
  {
    target: '#nav-primary-simple',
    title: 'Navigation Sidebar',
    content: 'Use the sidebar to navigate between different sections of Red AI. Toggle it with the hamburger menu in the header.',
    placement: 'right',
  },
  {
    target: '[id="home"]',
    title: 'Home Dashboard',
    content: 'Your starting point. Find quick-start actions, recent projects, and your getting-started checklist here.',
    placement: 'right',
  },
  {
    target: '[id="canvas"]',
    title: 'Canvas',
    content: 'Create and manage visual workflow projects. Drag nodes, connect them, and build AI pipelines.',
    placement: 'right',
  },
  {
    target: '[id="communityPlugins"]',
    title: 'Community Plugins',
    content: 'Browse plugins, launch Quickstarts, and explore Developer Preview. Deployed plugins appear here too.',
    placement: 'right',
  },
  {
    target: '[id="settings"]',
    title: 'Settings',
    content: 'Configure notebook images, cluster settings, accelerator profiles, and user management.',
    placement: 'right',
  },
];

interface TourPosition {
  top: number;
  left: number;
  placement: TourStep['placement'];
}

const NAV_GROUPS_TO_EXPAND: Record<string, string[]> = {
  '[id="canvas"]': ['canvas'],
  '[id="communityPlugins"]': ['communityPlugins'],
  '[id="settings"]': ['settings'],
};

const ensureNavGroupsExpanded = (groupIds: string[]) => {
  groupIds.forEach((groupId) => {
    const group = document.getElementById(groupId);
    const toggle = group?.querySelector('button[aria-expanded="false"]') as HTMLButtonElement | null;
    toggle?.click();
  });
};

const getTourPosition = (rect: DOMRect, placement: TourStep['placement'] = 'right'): TourPosition => {
  const cardWidth = 320;
  const cardHeight = 200;
  const gap = 16;

  switch (placement) {
    case 'left':
      return {
        top: Math.max(16, rect.top + rect.height / 2 - cardHeight / 2),
        left: Math.max(16, rect.left - cardWidth - gap),
        placement,
      };
    case 'bottom':
      return {
        top: rect.bottom + gap,
        left: Math.max(16, rect.left + rect.width / 2 - cardWidth / 2),
        placement,
      };
    case 'top':
      return {
        top: Math.max(16, rect.top - cardHeight - gap),
        left: Math.max(16, rect.left + rect.width / 2 - cardWidth / 2),
        placement,
      };
    case 'right':
    default:
      return {
        top: Math.max(16, rect.top + rect.height / 2 - cardHeight / 2),
        left: Math.min(window.innerWidth - cardWidth - 16, rect.right + gap),
        placement: 'right',
      };
  }
};

const GuidedTour: React.FunctionComponent = () => {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isActive, setIsActive] = React.useState(false);
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);

  const startTour = React.useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    setSidebarOpen(true);
    sessionStorage.setItem('tourInProgress', 'true');
  }, [setSidebarOpen]);

  React.useEffect(() => {
    const hasSeenTour = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasSeenTour) {
      const timer = window.setTimeout(startTour, 1500);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [startTour]);

  React.useEffect(() => {
    if (!isActive) return undefined;

    const step = TOUR_STEPS[currentStep];
    if (!step) return undefined;

    const updateRect = () => {
      const groupsToExpand = NAV_GROUPS_TO_EXPAND[step.target];
      if (groupsToExpand) {
        ensureNavGroupsExpanded(groupsToExpand);
      }

      const el = document.querySelector(step.target) as HTMLElement | null;
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    };

    updateRect();
    const interval = window.setInterval(updateRect, 250);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [currentStep, isActive, sidebarOpen]);

  const completeTour = () => {
    setIsActive(false);
    setTargetRect(null);
    sessionStorage.removeItem('tourInProgress');
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isActive || !targetRect) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const cardPosition = getTourPosition(targetRect, step.placement);

  return (
    <>
      <div className="guided-tour-backdrop" onClick={completeTour} />
      <div
        className="guided-tour-highlight"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
      />
      <div
        className="guided-tour-card"
        style={{
          top: cardPosition.top,
          left: cardPosition.left,
        }}
        role="dialog"
        aria-labelledby="guided-tour-title"
      >
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Title headingLevel="h4" size="md" id="guided-tour-title">{step.title}</Title>
          </FlexItem>
          <FlexItem>
            <Label isCompact>{currentStep + 1} / {TOUR_STEPS.length}</Label>
          </FlexItem>
        </Flex>
        <p className="guided-tour-card__content">{step.content}</p>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ marginTop: '16px' }}>
          <FlexItem>
            <Button variant="link" onClick={completeTour} size="sm">
              Skip Tour
            </Button>
          </FlexItem>
          <FlexItem>
            <Flex gap={{ default: 'gapSm' }}>
              {currentStep > 0 && (
                <FlexItem>
                  <Button variant="secondary" onClick={handlePrev} size="sm">
                    Previous
                  </Button>
                </FlexItem>
              )}
              <FlexItem>
                <Button variant="primary" onClick={handleNext} size="sm">
                  {isLast ? 'Finish' : 'Next'}
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </div>
    </>
  );
};

export { GuidedTour };
