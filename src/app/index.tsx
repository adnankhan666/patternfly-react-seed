import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppLayout } from '@app/AppLayout/AppLayout';
import { AppRoutes } from '@app/routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import '@app/app.css';

// Clear all app localStorage on load during development
const RESET_BUILD = '20260716-1217';
if (localStorage.getItem('_resetBuild') !== RESET_BUILD) {
  localStorage.clear();
  localStorage.setItem('_resetBuild', RESET_BUILD);
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
