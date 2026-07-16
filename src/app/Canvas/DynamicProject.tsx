import * as React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PageSection } from '@patternfly/react-core';
import { WorkflowCanvas } from './WorkflowCanvas';
import { CanvasLoadingTransition } from './components/CanvasLoadingTransition';
import { useSidebar } from '../contexts/SidebarContext';
import { toCanvasProjectSlug } from '../../data/pluginRegistry';
import { consumeCanvasLoadingTransition } from './utils/canvasLoadingTransition';
import './components/CanvasLoadingTransition.css';

const titleCaseSlug = (slug: string): string =>
  slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const resolveProjectDisplayName = (slug: string): string => {
  try {
    const projects: string[] = JSON.parse(localStorage.getItem('canvasProjects') || '[]');
    const normalizedSlug = slug.toLowerCase();
    const match = projects.find((project) => toCanvasProjectSlug(project) === normalizedSlug);
    if (match) return match;
  } catch {
    // fall through to title-case fallback
  }
  return titleCaseSlug(slug);
};

const DynamicProject: React.FunctionComponent = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const [searchParams] = useSearchParams();
  const { setSidebarOpen } = useSidebar();
  const autoExecute = searchParams.get('autoExecute') === 'true';
  const [showLoading, setShowLoading] = React.useState(() =>
    !autoExecute && (searchParams.get('deployed') === 'true' || consumeCanvasLoadingTransition())
  );
  const [canvasVisible, setCanvasVisible] = React.useState(autoExecute || !showLoading);

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  React.useEffect(() => {
    if (autoExecute) {
      setCanvasVisible(true);
      setShowLoading(false);
      return;
    }

    if (!showLoading) {
      setCanvasVisible(true);
      return;
    }

    setCanvasVisible(false);
    const revealTimer = window.setTimeout(() => setCanvasVisible(true), 1600);
    const hideTimer = window.setTimeout(() => setShowLoading(false), 2200);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(hideTimer);
    };
  }, [showLoading, projectName, autoExecute]);

  const slug = projectName ? decodeURIComponent(projectName) : '';
  const displayName = slug ? resolveProjectDisplayName(slug) : 'Project';

  return (
    <PageSection
      padding={{ default: 'noPadding' }}
      isFilled
      style={{
        height: 'calc(100vh - 76px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div className="canvas-project-shell">
        {canvasVisible && (
          <div className={`canvas-project-shell__canvas ${showLoading ? '' : 'canvas-project-shell--revealing'}`}>
            <WorkflowCanvas projectName={displayName} projectSlug={slug} autoExecute={autoExecute} />
          </div>
        )}
        {showLoading && (
          <div className={`canvas-loading-overlay ${canvasVisible ? 'canvas-loading-overlay--fading' : ''}`}>
            <CanvasLoadingTransition projectName={displayName} />
          </div>
        )}
      </div>
    </PageSection>
  );
};

export { DynamicProject };
