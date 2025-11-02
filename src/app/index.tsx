import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppLayout } from '@app/AppLayout/AppLayout';
import { AppRoutes } from '@app/routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import '@app/app.css';

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
