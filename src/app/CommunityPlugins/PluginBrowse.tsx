import * as React from 'react';
import { PageSection } from '@patternfly/react-core';
import { PluginBrowseSection } from './PluginBrowseSection';

const PluginBrowse: React.FunctionComponent = () => (
  <PageSection hasBodyWrapper={false}>
    <PluginBrowseSection />
  </PageSection>
);

export { PluginBrowse };
