import * as React from 'react';
import {
  Alert,
  AlertActionCloseButton,
  Flex,
  FlexItem,
} from '@patternfly/react-core';

const CURRENT_VERSION = 'v12';

const WhatsNewBanner: React.FunctionComponent = () => {
  const [dismissed, setDismissed] = React.useState(() =>
    localStorage.getItem(`whatsNewDismissed-${CURRENT_VERSION}`) === 'true'
  );

  if (dismissed) return null;

  return (
    <div style={{ padding: '0 16px' }}>
      <Alert
        variant="info"
        isInline
        title="What's New in Red AI"
        actionClose={
          <AlertActionCloseButton
            onClose={() => {
              setDismissed(true);
              localStorage.setItem(`whatsNewDismissed-${CURRENT_VERSION}`, 'true');
            }}
          />
        }
      >
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapXs' }}>
          <FlexItem>Community Plugins restructured — Quickstarts and Developer Preview are now sub-pages</FlexItem>
          <FlexItem>Helm Chart import unified into Canvas — select from catalog, URI, or upload directly</FlexItem>
          <FlexItem>Consolidated home page with Community popover for quick access</FlexItem>
          <FlexItem>Developer Preview section scaffolded for upcoming experimental features</FlexItem>
        </Flex>
      </Alert>
    </div>
  );
};

export { WhatsNewBanner };
