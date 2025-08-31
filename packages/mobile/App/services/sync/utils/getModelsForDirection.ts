import { SYNC_DIRECTIONS } from '../../../models/types';
import { MODELS_MAP } from '~/models/modelsMap';

import { type EntityManager } from 'typeorm';

export type TransactingModel = typeof MODELS_MAP[keyof typeof MODELS_MAP] & {
  getTransactionalRepository: () => any;
};

export type TransactingModelMap = {
  [tableName: string]: typeof MODELS_MAP[keyof typeof MODELS_MAP] & { getTransactionalRepository: () => any };
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
  for (const modelClass of Object.values(modelsForDirection)) {
    transactionalModels[modelClass.getTableName()] = modelClass;
    transactionalModels[modelClass.getTableName()].getTransactionalRepository = () =>
      entityManager.getRepository(modelClass);
  }

  return transactionalModels;
};
