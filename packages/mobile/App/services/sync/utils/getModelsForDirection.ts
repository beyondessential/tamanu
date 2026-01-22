import { SYNC_DIRECTIONS } from '../../../models/types';
import { MODELS_MAP } from '~/models/modelsMap';

import { type EntityManager } from 'typeorm';

export type TransactingModel = typeof MODELS_MAP[keyof typeof MODELS_MAP] & {
  getTransactionalRepository: () => any;
};

type TransactingModelMap = {
  [K in keyof Partial<typeof MODELS_MAP>]: typeof MODELS_MAP[K] & { getTransactionalRepository: () => any };
};

export const getModelsForDirection = (
  models: typeof MODELS_MAP,
  direction: SYNC_DIRECTIONS,
): Partial<typeof MODELS_MAP> =>
  Object.fromEntries(
    Object.entries(models).filter(([, model]) =>
      [direction, SYNC_DIRECTIONS.BIDIRECTIONAL].includes(model.syncDirection),
    ),
  );

export const getTransactingModelsForDirection = (
  models: typeof MODELS_MAP,
  direction: SYNC_DIRECTIONS,
  entityManager: EntityManager,
): TransactingModelMap => {
  const modelsForDirection = getModelsForDirection(models, direction);

  // Create a model map with getTransactionalRepository method bound to the transactional entity manager
  const transactionalModels = {};
  for (const [modelName, modelClass] of Object.entries(modelsForDirection)) {
    transactionalModels[modelName] = modelClass;
    transactionalModels[modelName].getTransactionalRepository = () =>
      entityManager.getRepository(modelClass);
  }

  return transactionalModels;
};
