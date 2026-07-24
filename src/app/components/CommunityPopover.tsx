import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  Button,
  Flex,
  FlexItem,
  Title,
  Label,
  Divider,
} from '@patternfly/react-core';
import {
  RocketIcon,
  FlaskIcon,
  PluggedIcon,
  ArrowRightIcon,
} from '@patternfly/react-icons';
import { getDeployedPlugins } from '../../data/pluginRegistry';
import { WORKFLOW_TEMPLATES } from '../../data/workflowTemplates';

interface CommunityPopoverProps {
  children: React.ReactElement;
}

const CommunityPopover: React.FunctionComponent<CommunityPopoverProps> = ({ children }) => {
  const navigate = useNavigate();
  const deployedPlugins = getDeployedPlugins();
  const templateCount = WORKFLOW_TEMPLATES.length;

  const highlights = [
    {
      label: `${templateCount} Quickstart Templates available`,
      route: '/plugins/quickstarts',
      icon: <RocketIcon style={{ color: '#8b5cf6' }} />,
    },
    {
      label: 'Early Access features',
      route: '/early-access',
      icon: <FlaskIcon style={{ color: '#f59e0b' }} />,
    },
    {
      label: `${deployedPlugins.length} plugin${deployedPlugins.length !== 1 ? 's' : ''} deployed`,
      route: '/plugins/deployed',
      icon: <PluggedIcon style={{ color: '#10b981' }} />,
    },
  ];

  return (
    <Popover
      aria-label="Community what's new"
      position="bottom"
      enableFlip
      headerContent={
        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
          <FlexItem>
            <Title headingLevel="h4" size="md">Community — What&apos;s New</Title>
          </FlexItem>
          <FlexItem>
            <Label color="blue" isCompact>Updated</Label>
          </FlexItem>
        </Flex>
      }
      bodyContent={
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }} style={{ minWidth: '260px' }}>
          {highlights.map((item, idx) => (
            <FlexItem key={idx}>
              <Button
                variant="link"
                isInline
                onClick={() => navigate(item.route)}
                style={{ textAlign: 'left', width: '100%' }}
              >
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <FlexItem>{item.icon}</FlexItem>
                  <FlexItem>
                    <span style={{ fontSize: '0.875rem' }}>{item.label}</span>
                  </FlexItem>
                </Flex>
              </Button>
            </FlexItem>
          ))}
        </Flex>
      }
      footerContent={
        <>
          <Divider style={{ marginBottom: '8px' }} />
          <Button
            variant="link"
            isInline
            icon={<ArrowRightIcon />}
            iconPosition="end"
            onClick={() => navigate('/plugins')}
          >
            View All Community Plugins
          </Button>
        </>
      }
    >
      {children}
    </Popover>
  );
};

export { CommunityPopover };
