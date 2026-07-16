import * as React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';

export interface CommunityPluginsBreadcrumbItem {
  label: string;
  to?: string;
}

interface CommunityPluginsBreadcrumbProps {
  items: CommunityPluginsBreadcrumbItem[];
}

const CommunityPluginsBreadcrumb: React.FunctionComponent<CommunityPluginsBreadcrumbProps> = ({
  items,
}) => (
  <Breadcrumb style={{ marginBottom: '12px' }}>
    <BreadcrumbItem>
      <Link to="/plugins">Community Plugins</Link>
    </BreadcrumbItem>
    {items.map((item, index) => {
      const isLast = index === items.length - 1;
      return (
        <BreadcrumbItem key={`${item.label}-${index}`} isActive={isLast}>
          {item.to && !isLast ? <Link to={item.to}>{item.label}</Link> : item.label}
        </BreadcrumbItem>
      );
    })}
  </Breadcrumb>
);

export { CommunityPluginsBreadcrumb };
