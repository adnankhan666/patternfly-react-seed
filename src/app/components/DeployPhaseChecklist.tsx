import * as React from 'react';
import {
  Flex,
  FlexItem,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { CheckCircleIcon, InProgressIcon } from '@patternfly/react-icons';
import { DEPLOYMENT_PHASES, PHASE_DESCRIPTIONS } from '../Canvas/types/deploymentPhases';

const DEPLOY_PHASE_ORDER = [
  DEPLOYMENT_PHASES.VALIDATE,
  DEPLOYMENT_PHASES.DEPLOY_INFRASTRUCTURE,
  DEPLOYMENT_PHASES.DEPLOY_SERVICES,
  DEPLOYMENT_PHASES.RUN_JOBS,
  DEPLOYMENT_PHASES.HEALTH_CHECKS,
  DEPLOYMENT_PHASES.READY,
];

interface DeployPhaseChecklistProps {
  title: string;
  subtitle?: string;
  activePhaseIndex: number;
  isComplete?: boolean;
}

const DeployPhaseChecklist: React.FunctionComponent<DeployPhaseChecklistProps> = ({
  title,
  subtitle,
  activePhaseIndex,
  isComplete = false,
}) => (
  <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }} style={{ padding: '3rem' }}>
    {!isComplete && (
      <FlexItem style={{ textAlign: 'center' }}>
        <Spinner size="xl" aria-label="Deploying" />
      </FlexItem>
    )}
    {isComplete && (
      <FlexItem style={{ textAlign: 'center' }}>
        <CheckCircleIcon style={{ fontSize: '4rem', color: '#16a34a' }} />
      </FlexItem>
    )}
    <FlexItem>
      <Title headingLevel="h2" size="xl" style={{ textAlign: 'center' }}>
        {title}
      </Title>
      {subtitle && (
        <p style={{ color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>{subtitle}</p>
      )}
    </FlexItem>
    <FlexItem>
      <Flex
        direction={{ default: 'column' }}
        gap={{ default: 'gapMd' }}
        style={{ maxWidth: '420px', margin: '0 auto' }}
      >
        {DEPLOY_PHASE_ORDER.map((phaseId, idx) => {
          const phase = PHASE_DESCRIPTIONS[phaseId];
          const isDone = isComplete || idx < activePhaseIndex;
          const isCurrent = !isComplete && idx === activePhaseIndex;

          return (
            <FlexItem key={phaseId}>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                <FlexItem>
                  {isDone ? (
                    <CheckCircleIcon style={{ color: '#16a34a', fontSize: '1.25rem' }} />
                  ) : isCurrent ? (
                    <InProgressIcon style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
                  ) : (
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: '2px solid #d1d5db',
                        display: 'inline-block',
                      }}
                    />
                  )}
                </FlexItem>
                <FlexItem>
                  <span
                    style={{
                      color: isDone ? '#16a34a' : isCurrent ? '#1f2937' : '#9ca3af',
                      fontWeight: isCurrent ? 600 : 400,
                    }}
                  >
                    {phase.icon} {phase.name}
                  </span>
                </FlexItem>
              </Flex>
            </FlexItem>
          );
        })}
      </Flex>
    </FlexItem>
  </Flex>
);

export { DeployPhaseChecklist, DEPLOY_PHASE_ORDER };
