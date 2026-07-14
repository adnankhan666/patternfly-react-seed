import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppLayout } from '@app/AppLayout/AppLayout';
import { AppRoutes } from '@app/routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import '@app/app.css';

// v11 clean slate: wipe all canvas projects and their workflow data
if (!localStorage.getItem('v11_clean')) {
  const oldProjects: string[] = JSON.parse(localStorage.getItem('canvasProjects') || '[]');
  oldProjects.forEach((p) => {
    const slug = p.toLowerCase().replace(/\s+/g, '-');
    localStorage.removeItem(`workflow-${slug}`);
  });
  localStorage.removeItem('canvasProjects');
  localStorage.removeItem('v11_migrated');
  localStorage.removeItem('nodePanelOpen');
  localStorage.setItem('v11_clean', 'true');
}

const App: React.FunctionComponent = () => (
  <ThemeProvider>
    <SidebarProvider>
      <Router>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </Router>
    </SidebarProvider>
  </ThemeProvider>
);

export default App;
