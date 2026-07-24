import * as React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  Switch,
  Content,
  Label,
  Divider,
  Alert,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import {
  isEarlyAccessUnlocked,
  unlockEarlyAccess,
  lockEarlyAccess,
  EARLY_ACCESS_UNLOCKED_EVENT,
} from '../navData';

const COMMUNITY_PLUGINS_ENABLED_KEY = 'communityPluginsEnabled';
const COMMUNITY_PLUGINS_TOGGLED_EVENT = 'community-plugins-toggled';

export function isCommunityPluginsEnabled(): boolean {
  try {
    const val = localStorage.getItem(COMMUNITY_PLUGINS_ENABLED_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setCommunityPluginsEnabled(enabled: boolean): void {
  localStorage.setItem(COMMUNITY_PLUGINS_ENABLED_KEY, String(enabled));
  window.dispatchEvent(new Event(COMMUNITY_PLUGINS_TOGGLED_EVENT));
}

export { COMMUNITY_PLUGINS_TOGGLED_EVENT };

const ClusterSettings: React.FunctionComponent = () => {
  const [communityEnabled, setCommunityEnabled] = React.useState(isCommunityPluginsEnabled);
  const [earlyAccessEnabled, setEarlyAccessEnabled] = React.useState(isEarlyAccessUnlocked);

  React.useEffect(() => {
    const refresh = () => setCommunityEnabled(isCommunityPluginsEnabled());
    window.addEventListener(COMMUNITY_PLUGINS_TOGGLED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(COMMUNITY_PLUGINS_TOGGLED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  React.useEffect(() => {
    const refresh = () => setEarlyAccessEnabled(isEarlyAccessUnlocked());
    window.addEventListener(EARLY_ACCESS_UNLOCKED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(EARLY_ACCESS_UNLOCKED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const handleCommunityToggle = (_e: React.FormEvent, checked: boolean) => {
    setCommunityPluginsEnabled(checked);
    setCommunityEnabled(checked);
  };

  const handleEarlyAccessToggle = (_e: React.FormEvent, checked: boolean) => {
    if (checked) {
      unlockEarlyAccess();
    } else {
      lockEarlyAccess();
    }
    setEarlyAccessEnabled(checked);
  };

  return (
    <PageSection hasBodyWrapper={false} style={{ paddingTop: '16px', paddingBottom: '16px' }}>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} style={{ maxWidth: '960px' }}>
        <FlexItem>
          <Title headingLevel="h1" size="2xl">Cluster Settings</Title>
          <Content>
            <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
              Manage cluster-wide dashboard configuration (simulated OdhDashboardConfig).
              These settings are admin-only and control feature visibility for all dashboard users.
            </p>
          </Content>
        </FlexItem>

        {/* Early Access */}
        <FlexItem>
          <Card>
            <CardHeader>
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <FlexItem>Early Access</FlexItem>
                  <FlexItem>
                    <Label isCompact color={earlyAccessEnabled ? 'purple' : 'grey'}>
                      {earlyAccessEnabled ? 'Unlocked' : 'Locked'}
                    </Label>
                  </FlexItem>
                  <FlexItem>
                    <Label isCompact color="orange">Admin only</Label>
                  </FlexItem>
                </Flex>
              </CardTitle>
            </CardHeader>
            <CardBody>
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
                <FlexItem>
                  <Switch
                    id="early-access-toggle"
                    label="Early Access Unlocked"
                    labelOff="Early Access Locked"
                    isChecked={earlyAccessEnabled}
                    onChange={handleEarlyAccessToggle}
                  />
                </FlexItem>
                <FlexItem>
                  <Content>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      When unlocked, the Early Access section appears in the sidebar giving users access to
                      Developer Preview and Technical Preview features. These features are not production-ready
                      and carry varying levels of support.
                      This maps to the <code>earlyAccessEnabled</code> flag in OdhDashboardConfig.
                    </p>
                  </Content>
                </FlexItem>

                {earlyAccessEnabled && (
                  <FlexItem>
                    <Alert
                      variant="info"
                      isInline
                      title="Early Access features are visible to all users"
                    >
                      Users can browse and deploy Developer Preview and Technical Preview features.
                      These features may be incomplete and are not covered by production SLAs.
                    </Alert>
                  </FlexItem>
                )}

                {!earlyAccessEnabled && (
                  <FlexItem>
                    <Alert
                      variant="warning"
                      isInline
                      title="Early Access is locked"
                    >
                      The Early Access nav section is hidden. Any previously deployed preview features
                      remain running but are not accessible from the dashboard navigation.
                    </Alert>
                  </FlexItem>
                )}

                <Divider />

                <FlexItem>
                  <DescriptionList isCompact isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>CRD</DescriptionListTerm>
                      <DescriptionListDescription><code>OdhDashboardConfig</code></DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Field</DescriptionListTerm>
                      <DescriptionListDescription><code>spec.dashboardConfig.earlyAccessEnabled</code></DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Access</DescriptionListTerm>
                      <DescriptionListDescription>
                        Requires <code>cluster-admin</code> or <code>odh-dashboard-admin</code> role
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>
        </FlexItem>

        {/* Community Plugins */}
        <FlexItem>
          <Card>
            <CardHeader>
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <FlexItem>Community Plugins</FlexItem>
                  <FlexItem>
                    <Label isCompact color={communityEnabled ? 'green' : 'grey'}>
                      {communityEnabled ? 'Enabled' : 'Disabled'}
                    </Label>
                  </FlexItem>
                  <FlexItem>
                    <Label isCompact color="orange">Admin only</Label>
                  </FlexItem>
                </Flex>
              </CardTitle>
            </CardHeader>
            <CardBody>
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
                <FlexItem>
                  <Switch
                    id="community-plugins-toggle"
                    label="Enable Community Plugins"
                    labelOff="Community Plugins Disabled"
                    isChecked={communityEnabled}
                    onChange={handleCommunityToggle}
                  />
                </FlexItem>
                <FlexItem>
                  <Content>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      When enabled, the Community Plugins section appears in the sidebar allowing users to
                      browse, install, and manage community-contributed plugins via Module Federation.
                      This maps to the <code>communityPluginsEnabled</code> flag in OdhDashboardConfig.
                    </p>
                  </Content>
                </FlexItem>

                {!communityEnabled && (
                  <FlexItem>
                    <Alert
                      variant="warning"
                      isInline
                      title="Community plugins are disabled"
                    >
                      The Community Plugins nav section is hidden. Installed plugins remain deployed
                      but their Module Federation entries are not loaded by the dashboard.
                    </Alert>
                  </FlexItem>
                )}

                <Divider />

                <FlexItem>
                  <DescriptionList isCompact isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>CRD</DescriptionListTerm>
                      <DescriptionListDescription><code>OdhDashboardConfig</code></DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Field</DescriptionListTerm>
                      <DescriptionListDescription><code>spec.dashboardConfig.communityPluginsEnabled</code></DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>JIRA</DescriptionListTerm>
                      <DescriptionListDescription><code>RHAIRFE-2685</code></DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>
        </FlexItem>
      </Flex>
    </PageSection>
  );
};

export { ClusterSettings };
