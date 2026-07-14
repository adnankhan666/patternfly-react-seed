import * as React from 'react';
import {
  Popover,
  Button,
  Flex,
  FlexItem,
  Content,
  Title,
  Label,
} from '@patternfly/react-core';


interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

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
    content: 'Browse 6 community plugins, install them, open dedicated workspaces, and deploy Helm charts with BYOH.',
    placement: 'right',
  },
  {
    target: '[id="settings"]',
    title: 'Settings',
    content: 'Configure notebook images, cluster settings, accelerator profiles, and user management.',
    placement: 'right',
  },
];

const GuidedTour: React.FunctionComponent = () => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isActive, setIsActive] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const startTour = React.useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  React.useEffect(() => {
    const hasSeenTour = localStorage.getItem('tourCompleted');
    if (!hasSeenTour) {
      const timer = setTimeout(startTour, 1500);
      return () => clearTimeout(timer);
    }
  }, [startTour]);

  React.useEffect(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    if (!step) return;
    const el = document.querySelector(step.target) as HTMLElement;
    setAnchorEl(el);
  }, [currentStep, isActive]);

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

  const completeTour = () => {
    setIsActive(false);
    localStorage.setItem('tourCompleted', 'true');
  };

  if (!isActive || !anchorEl) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 9990,
        }}
        onClick={completeTour}
      />
      <Popover
        isVisible
        shouldOpen={() => true}
        shouldClose={() => false}
        triggerRef={() => anchorEl}
        position={step.placement || 'right'}
        headerContent={
          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <Title headingLevel="h4" size="md">{step.title}</Title>
            </FlexItem>
            <FlexItem>
              <Label isCompact>{currentStep + 1} / {TOUR_STEPS.length}</Label>
            </FlexItem>
          </Flex>
        }
        bodyContent={
          <Content>
            <p>{step.content}</p>
          </Content>
        }
        footerContent={
          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ width: '100%' }}>
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
        }
      />
    </>
  );
};

export { GuidedTour };
