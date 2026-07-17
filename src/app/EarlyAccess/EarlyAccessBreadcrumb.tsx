import * as React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';

export interface EarlyAccessBreadcrumbItem {
  label: string;
  to?: string;
}

interface EarlyAccessBreadcrumbProps {
  items: EarlyAccessBreadcrumbItem[];
}

const EarlyAccessBreadcrumb: React.FunctionComponent<EarlyAccessBreadcrumbProps> = ({
  items,
}) => (
  <Breadcrumb style={{ marginBottom: '12px' }}>
    <BreadcrumbItem>
      <Link to="/early-access">Early Access</Link>
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

export { EarlyAccessBreadcrumb };
