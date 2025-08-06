import { SYNC_DIRECTIONS } from '../../../models/types';
import { MODELS_MAP } from '~/models/modelsMap';

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
  entityManager: any,
): Partial<typeof MODELS_MAP> => {
  const modelsForDirection = getModelsForDirection(models, direction);

  // Create a model map with getTransactionalRepository method bound to the transactional entity manager
  const transactionalModels = {};
  for (const [modelName, modelClass] of Object.entries(modelsForDirection)) {
    transactionalModels[modelName] = modelClass;
    transactionalModels[modelName].getTransactionalRepository = () => entityManager.getRepository(modelClass);
  }

  return transactionalModels;
};
