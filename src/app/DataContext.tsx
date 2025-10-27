import * as React from 'react';
import { allData } from '@app/data';

interface DataContextType {
  models: any[];
  experiments: any[];
  pipelines: any[];
  projects: any[];
  notebooks: any[];
  modelRegistry: any[];
}

const DataContext = React.createContext<DataContextType>(allData);

export const useData = () => React.useContext(DataContext);

export const DataProvider: React.FunctionComponent<{ children: React.ReactNode }> = ({ children }) => {
  return <DataContext.Provider value={allData}>{children}</DataContext.Provider>;
};
