import * as React from 'react';
import {
  PageSection,
  Title,
  Flex,
  FlexItem,
  Content,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { PluginBrowseSection } from './PluginBrowseSection';
import { CommunityPluginsBreadcrumb } from './CommunityPluginsBreadcrumb';

const CommunityPluginsDeployed: React.FunctionComponent = () => (
  <PageSection hasBodyWrapper={false} style={{ paddingTop: '16px', paddingBottom: '16px' }}>
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      <FlexItem>
        <CommunityPluginsBreadcrumb items={[{ label: 'Deployed' }]} />
        <Title headingLevel="h1" size="xl">
          <CheckCircleIcon style={{ marginRight: '8px', color: '#10b981' }} />
          Deployed Plugins
        </Title>
        <Content>
          <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Community plugins you have deployed. Open a workspace from a card or the sidebar.
          </p>
        </Content>
      </FlexItem>
      <FlexItem>
        <PluginBrowseSection showSectionHeader={false} deployedOnly />
      </FlexItem>
    </Flex>
  </PageSection>
);

export { CommunityPluginsDeployed };
