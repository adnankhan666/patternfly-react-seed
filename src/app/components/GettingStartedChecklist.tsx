import * as React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  Button,
  Progress,
  ProgressMeasureLocation,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  OutlinedCircleIcon,
  TimesIcon,
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import { getDeployedPluginIds } from '../../data/pluginRegistry';

interface ChecklistItem {
  id: string;
  label: string;
  route: string;
  check: () => boolean;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'create-project',
    label: 'Create your first project',
    route: '/canvas',
    check: () => {
      const projects = JSON.parse(localStorage.getItem('canvasProjects') || '[]');
      return projects.length > 0;
    },
  },
  {
    id: 'load-template',
    label: 'Load a workflow template',
    route: '/quickstart',
    check: () => {
      const keys = Object.keys(localStorage);
      return keys.some((k) => {
        if (!k.startsWith('workflow-')) return false;
        try {
          const data = JSON.parse(localStorage.getItem(k) || '{}');
          return data.templateId || (data.nodes && data.nodes.length > 0);
        } catch { return false; }
      });
    },
  },
  {
    id: 'explore-plugins',
    label: 'Browse Community Plugins',
    route: '/plugins',
    check: () => getDeployedPluginIds().length > 0,
  },
  {
    id: 'explore-catalog',
    label: 'Check out the Model Catalog',
    route: '/modelCatalog',
    check: () => localStorage.getItem('visitedModelCatalog') === 'true',
  },
];

const GettingStartedChecklist: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = React.useState(() =>
    localStorage.getItem('checklistDismissed') === 'true'
  );
  const [completedItems, setCompletedItems] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const completed = new Set<string>();
    CHECKLIST_ITEMS.forEach((item) => {
      if (item.check()) completed.add(item.id);
    });
    setCompletedItems(completed);
  }, []);

  if (dismissed) return null;

  const completedCount = completedItems.size;
  const totalCount = CHECKLIST_ITEMS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  return (
    <Card>
      <CardTitle>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            {allDone ? 'All done! You\'re ready to go.' : 'Getting Started'}
          </FlexItem>
          <FlexItem>
            <Button
              variant="plain"
              icon={<TimesIcon />}
              onClick={() => {
                setDismissed(true);
                localStorage.setItem('checklistDismissed', 'true');
              }}
              aria-label="Dismiss checklist"
            />
          </FlexItem>
        </Flex>
      </CardTitle>
      <CardBody>
        <Progress
          value={progressPercent}
          title="Progress"
          measureLocation={ProgressMeasureLocation.outside}
          style={{ marginBottom: '16px' }}
          aria-label="Getting started progress"
        />
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
          {CHECKLIST_ITEMS.map((item) => {
            const done = completedItems.has(item.id);
            return (
              <FlexItem key={item.id}>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <FlexItem>
                    {done ? (
                      <CheckCircleIcon style={{ color: '#16a34a' }} />
                    ) : (
                      <OutlinedCircleIcon style={{ color: '#d1d5db' }} />
                    )}
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <span style={{
                      textDecoration: done ? 'line-through' : 'none',
                      color: done ? '#9ca3af' : 'inherit',
                    }}>
                      {item.label}
                    </span>
                  </FlexItem>
                  {!done && (
                    <FlexItem>
                      <Button variant="link" isInline size="sm" onClick={() => navigate(item.route)}>
                        Start
                      </Button>
                    </FlexItem>
                  )}
                </Flex>
              </FlexItem>
            );
          })}
        </Flex>
      </CardBody>
    </Card>
  );
};

export { GettingStartedChecklist };
