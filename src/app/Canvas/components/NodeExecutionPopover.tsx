import * as React from 'react';
import {
  Flex,
  FlexItem,
  Spinner,
  Progress,
  ProgressMeasureLocation,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { NodeDeploymentStatus } from '../types/deploymentPhases';
import { getPhaseName } from '../utils/nodeDeploymentDescriptions';
import './NodeExecutionPopover.css';

interface NodeExecutionPopoverProps {
  nodeLabel: string;
  resourceType: string;
  phase: number;
  state: NodeDeploymentStatus['state'];
  description: string;
  completedCount: number;
  totalCount: number;
}

const NodeExecutionPopover: React.FunctionComponent<NodeExecutionPopoverProps> = ({
  nodeLabel,
  resourceType,
  phase,
  state,
  description,
  completedCount,
  totalCount,
}) => {
  const isComplete = state === 'ready' && completedCount >= totalCount && totalCount > 0;
  const progressValue = totalCount > 0
    ? Math.min(100, Math.round((completedCount / totalCount) * 100))
    : 0;

  return (
    <div className="node-execution-status-bar" role="status" aria-live="polite">
      <Flex
        alignItems={{ default: 'alignItemsCenter' }}
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        gap={{ default: 'gapMd' }}
        flexWrap={{ default: 'nowrap' }}
      >
        <FlexItem>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            <FlexItem>
              {isComplete ? (
                <CheckCircleIcon className="node-execution-status-bar__icon node-execution-status-bar__icon--ready" />
              ) : (
                <Spinner size="sm" aria-label="Deploying" />
              )}
            </FlexItem>
            <FlexItem>
              <span className="node-execution-status-bar__phase">{getPhaseName(phase)}</span>
              <span className="node-execution-status-bar__separator">·</span>
              <span className="node-execution-status-bar__node">
                {isComplete ? 'Deployment complete' : `Working on ${nodeLabel}`}
              </span>
            </FlexItem>
          </Flex>
        </FlexItem>

        <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: 0 }}>
          <span className="node-execution-status-bar__description" title={description}>
            {description}
          </span>
        </FlexItem>

        <FlexItem>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
            <FlexItem>
              <span className="node-execution-status-bar__meta">
                {completedCount}/{totalCount} nodes · {resourceType}
              </span>
            </FlexItem>
            <FlexItem style={{ width: '120px' }}>
              <Progress
                value={progressValue}
                measureLocation={ProgressMeasureLocation.none}
                aria-label={`Deployment progress ${completedCount} of ${totalCount}`}
                size="sm"
              />
            </FlexItem>
          </Flex>
        </FlexItem>
      </Flex>
    </div>
  );
};

export { NodeExecutionPopover };
