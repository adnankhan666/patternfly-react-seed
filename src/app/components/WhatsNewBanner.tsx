import * as React from 'react';
import {
  Alert,
  AlertActionCloseButton,
  Flex,
  FlexItem,
} from '@patternfly/react-core';

const CURRENT_VERSION = 'v11';

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
          <FlexItem>Plugin Marketplace — browse, install, and open workspaces for 6 community plugins</FlexItem>
          <FlexItem>BYOH Helm Deploy — bring your own chart via URI or file upload</FlexItem>
          <FlexItem>Plugin-specific Canvas nodes — visualize plugin workflows on the canvas</FlexItem>
          <FlexItem>Quickstart Wizard — deploy templates in 1-2 clicks</FlexItem>
          <FlexItem>Cleaner Canvas toolbar with floating controls</FlexItem>
        </Flex>
      </Alert>
    </div>
  );
};

export { WhatsNewBanner };
