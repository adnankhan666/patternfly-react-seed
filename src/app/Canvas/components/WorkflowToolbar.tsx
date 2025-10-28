import * as React from 'react';
import {
  Card,
  CardBody,
  Flex,
  FlexItem,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  Button,
} from '@patternfly/react-core';
import {
  PlayIcon,
  SaveIcon,
  PlusIcon,
  UndoIcon,
  RedoIcon,
  DownloadIcon,
  UploadIcon,
  ThIcon,
  SearchPlusIcon,
  SearchMinusIcon,
} from '@patternfly/react-icons';

interface WorkflowToolbarProps {
  projectName: string;
  gridEnabled: boolean;
  zoom: number;
  pan: { x: number; y: number };
  MIN_ZOOM: number;
  MAX_ZOOM: number;
  canUndo: boolean;
  canRedo: boolean;
  onNew: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  onExecute: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onToggleGrid: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export const WorkflowToolbar: React.FunctionComponent<WorkflowToolbarProps> = React.memo(({
  projectName,
  gridEnabled,
  zoom,
  pan,
  MIN_ZOOM,
  MAX_ZOOM,
  canUndo,
  canRedo,
  onNew,
  onSave,
  onExport,
  onImport,
  onExecute,
  onUndo,
  onRedo,
  onClear,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  return (
    <Card isCompact>
      <CardBody style={{ padding: '12px 16px' }}>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Title headingLevel="h1" size="xl" aria-label={`Workflow project: ${projectName}`}>
              {projectName}
            </Title>
          </FlexItem>
          <FlexItem>
            <Toolbar aria-label="Workflow toolbar">
              <ToolbarContent>
                <ToolbarGroup aria-label="Workflow actions">
                  <ToolbarItem>
                    <Button
                      variant="secondary"
                      icon={<PlusIcon />}
                      onClick={onNew}
                      aria-label="Create new workflow"
                    >
                      New
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      variant="secondary"
                      icon={<SaveIcon />}
                      onClick={onSave}
                      aria-label="Save current workflow"
                    >
                      Save
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      variant="secondary"
                      icon={<DownloadIcon />}
                      onClick={onExport}
                      aria-label="Export workflow to file"
                    >
                      Export
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      variant="secondary"
                      icon={<UploadIcon />}
                      onClick={onImport}
                      aria-label="Import workflow from file"
                    >
                      Import
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      variant="primary"
                      icon={<PlayIcon />}
                      onClick={onExecute}
                      aria-label="Execute workflow"
                    >
                      Execute
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      variant="link"
                      icon={<UndoIcon />}
                      onClick={onUndo}
                      isDisabled={!canUndo}
                      aria-label="Undo last action"
                      aria-disabled={!canUndo}
                    >
                      Undo
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      variant="link"
                      icon={<RedoIcon />}
                      onClick={onRedo}
                      isDisabled={!canRedo}
                      aria-label="Redo last undone action"
                      aria-disabled={!canRedo}
                    >
                      Redo
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      variant="link"
                      onClick={onClear}
                      aria-label="Clear all nodes from canvas"
                    >
                      Clear
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      variant={gridEnabled ? 'primary' : 'secondary'}
                      icon={<ThIcon />}
                      onClick={onToggleGrid}
                      title={gridEnabled ? 'Disable grid' : 'Enable grid'}
                      aria-label={gridEnabled ? 'Disable grid snapping' : 'Enable grid snapping'}
                      aria-pressed={gridEnabled}
                    >
                      Grid
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      variant="link"
                      icon={<SearchPlusIcon />}
                      onClick={onZoomIn}
                      isDisabled={zoom >= MAX_ZOOM}
                      title="Zoom in"
                      aria-label={`Zoom in canvas (current zoom: ${Math.round(zoom * 100)}%)`}
                      aria-disabled={zoom >= MAX_ZOOM}
                    >
                      Zoom In
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      variant="link"
                      icon={<SearchMinusIcon />}
                      onClick={onZoomOut}
                      isDisabled={zoom <= MIN_ZOOM}
                      title="Zoom out"
                      aria-label={`Zoom out canvas (current zoom: ${Math.round(zoom * 100)}%)`}
                      aria-disabled={zoom <= MIN_ZOOM}
                    >
                      Zoom Out
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      variant="link"
                      onClick={onResetZoom}
                      isDisabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                      title="Reset zoom"
                      aria-label="Reset zoom and pan to default"
                      aria-disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                    >
                      Reset
                    </Button>
                  </ToolbarItem>
                </ToolbarGroup>
              </ToolbarContent>
            </Toolbar>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
});

WorkflowToolbar.displayName = 'WorkflowToolbar';
