import * as React from 'react';
import {
  Flex,
  FlexItem,
  Title,
  Spinner,
  Progress,
  ProgressSize,
} from '@patternfly/react-core';
import { RocketIcon } from '@patternfly/react-icons';
import './CanvasLoadingTransition.css';

interface CanvasLoadingTransitionProps {
  projectName: string;
  subtitle?: string;
}

const CanvasLoadingTransition: React.FunctionComponent<CanvasLoadingTransitionProps> = ({
  projectName,
  subtitle = 'Loading workflow resources and preparing your canvas workspace...',
}) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + 8;
      });
    }, 150);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="canvas-loading-transition" role="status" aria-live="polite">
      <Flex
        direction={{ default: 'column' }}
        alignItems={{ default: 'alignItemsCenter' }}
        gap={{ default: 'gapLg' }}
        className="canvas-loading-transition__content"
      >
        <FlexItem>
          <RocketIcon style={{ fontSize: '3rem', color: '#8b5cf6' }} />
        </FlexItem>
        <FlexItem>
          <Title headingLevel="h2" size="xl">Preparing your workspace</Title>
        </FlexItem>
        <FlexItem>
          <p className="canvas-loading-transition__project">{projectName}</p>
        </FlexItem>
        <FlexItem>
          <p className="canvas-loading-transition__subtitle">{subtitle}</p>
        </FlexItem>
        <FlexItem style={{ width: '100%', maxWidth: '360px' }}>
          <Progress value={progress} title="Loading" size={ProgressSize.sm} />
        </FlexItem>
        <FlexItem>
          <Spinner size="lg" aria-label="Loading canvas" />
        </FlexItem>
      </Flex>
    </div>
  );
};

export { CanvasLoadingTransition };
