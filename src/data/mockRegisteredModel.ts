/**
 * Mock data factory for Registered Models
 * Adapted from ODH Dashboard mockRegisteredModel
 */

export enum ModelState {
  LIVE = 'LIVE',
  ARCHIVED = 'ARCHIVED',
  UNKNOWN = 'UNKNOWN',
}

export type ModelRegistryCustomProperties = Record<string, string | number | boolean>;

export interface RegisteredModel {
  id: string;
  name: string;
  owner: string;
  state: ModelState;
  description: string;
  customProperties: ModelRegistryCustomProperties;
  createTimeSinceEpoch: string;
  lastUpdateTimeSinceEpoch: string;
  externalID: string;
}

type MockRegisteredModelType = {
  id?: string;
  name?: string;
  owner?: string;
  state?: ModelState;
  description?: string;
  customProperties?: ModelRegistryCustomProperties;
};

/**
 * Factory function to create mock RegisteredModel instances for testing
 *
 * @example
 * ```typescript
 * const model = mockRegisteredModel({
 *   name: 'My ML Model',
 *   owner: 'Data Science Team',
 *   state: ModelState.LIVE
 * });
 * ```
 */
export const mockRegisteredModel = ({
  name = 'test',
  owner = 'Author 1',
  state = ModelState.LIVE,
  description = '',
  customProperties = {},
  id = '1',
}: MockRegisteredModelType = {}): RegisteredModel => ({
  createTimeSinceEpoch: '1710404288975',
  description,
  externalID: '1234132asdfasdf',
  id,
  lastUpdateTimeSinceEpoch: '1710404288975',
  name,
  state,
  owner,
  customProperties,
});

/**
 * Collection of pre-configured mock models for common testing scenarios
 */
export const MOCK_REGISTERED_MODELS = {
  liveModel: mockRegisteredModel({
    id: '1',
    name: 'Live Production Model',
    owner: 'ML Engineering Team',
    state: ModelState.LIVE,
    description: 'Production model serving real-time predictions',
    customProperties: {
      framework: 'tensorflow',
      version: '2.0',
      accuracy: 0.95,
    },
  }),

  archivedModel: mockRegisteredModel({
    id: '2',
    name: 'Archived Legacy Model',
    owner: 'Data Science Team',
    state: ModelState.ARCHIVED,
    description: 'Legacy model replaced by newer version',
    customProperties: {
      framework: 'pytorch',
      version: '1.0',
      accuracy: 0.88,
    },
  }),

  trainingModel: mockRegisteredModel({
    id: '3',
    name: 'Training Model v3',
    owner: 'Research Team',
    state: ModelState.LIVE,
    description: 'Model currently in training phase',
    customProperties: {
      framework: 'scikit-learn',
      version: '3.0',
      status: 'training',
    },
  }),
};
