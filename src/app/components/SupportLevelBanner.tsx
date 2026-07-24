import * as React from 'react';
import {
  Alert,
  Flex,
  FlexItem,
  Label,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';

export type SupportContext = 'community-plugins' | 'early-access';

interface SupportLevelBannerProps {
  context: SupportContext;
}

const CONTENT: Record<SupportContext, { title: string; body: React.ReactNode }> = {
  'community-plugins': {
    title: 'Community plugins are not supported by Red Hat',
    body: (
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
        <FlexItem>
          Community plugins are developed and maintained by independent contributors.
          They are <strong>not covered by Red Hat support subscriptions</strong>, SLAs, or errata.
        </FlexItem>
        <FlexItem>
          <Flex gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
            <FlexItem><Label isCompact color="red" icon={<ExclamationTriangleIcon />}>No Red Hat support</Label></FlexItem>
            <FlexItem><Label isCompact color="orange">No SLA guarantees</Label></FlexItem>
            <FlexItem><Label isCompact color="blue">Community maintained</Label></FlexItem>
            <FlexItem><Label isCompact color="grey">Use at your own risk</Label></FlexItem>
          </Flex>
        </FlexItem>
      </Flex>
    ),
  },
  'early-access': {
    title: 'Early Access features carry limited or no support',
    body: (
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
        <FlexItem>
          Features marked <strong>Developer Preview (DP)</strong> are experimental and unsupported.
          Features marked <strong>Technical Preview (TP)</strong> have limited support but are not production-ready.
          Both may change or be removed without notice.
        </FlexItem>
        <FlexItem>
          <Flex gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
            <FlexItem><Label isCompact color="orange" icon={<ExclamationTriangleIcon />}>DP: No support &mdash; experimental only</Label></FlexItem>
            <FlexItem><Label isCompact color="purple">TP: Limited support &mdash; not production-ready</Label></FlexItem>
            <FlexItem><Label isCompact color="grey">APIs and behavior may change</Label></FlexItem>
          </Flex>
        </FlexItem>
      </Flex>
    ),
  },
};

const SupportLevelBanner: React.FunctionComponent<SupportLevelBannerProps> = ({ context }) => {
  const { title, body } = CONTENT[context];

  return (
    <Alert
      variant="warning"
      isInline
      title={title}
      style={{ marginBottom: 0 }}
    >
      {body}
    </Alert>
  );
};

export { SupportLevelBanner };
