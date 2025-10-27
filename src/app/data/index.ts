import modelsData from './models.json';
import experimentsData from './experiments.json';
import pipelinesData from './pipelines.json';
import projectsData from './projects.json';
import notebooksData from './notebooks.json';
import modelRegistryData from './modelRegistry.json';

export const models = modelsData;
export const experiments = experimentsData;
export const pipelines = pipelinesData;
export const projects = projectsData;
export const notebooks = notebooksData;
export const modelRegistry = modelRegistryData;

// Combined export for chatbot context
export const allData = {
  models: modelsData,
  experiments: experimentsData,
  pipelines: pipelinesData,
  projects: projectsData,
  notebooks: notebooksData,
  modelRegistry: modelRegistryData,
};
