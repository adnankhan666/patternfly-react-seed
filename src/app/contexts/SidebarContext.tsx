import * as React from 'react';

interface SidebarContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({ sidebarOpen, setSidebarOpen, toggleSidebar }),
    [sidebarOpen, toggleSidebar]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebar = () => {
  const context = React.useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
