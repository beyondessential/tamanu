import { SYNC_DIRECTIONS } from '../../../models/types';
import { MODELS_MAP } from '~/models/modelsMap';
import { Connection } from 'typeorm';

export const getModelsForDirection = (
  models: typeof MODELS_MAP,
  direction: SYNC_DIRECTIONS,
): Partial<typeof MODELS_MAP> =>  Object.fromEntries(
    Object.entries(models).filter(
      ([, model]) => [direction, SYNC_DIRECTIONS.BIDIRECTIONAL].includes(model.syncDirection),
    ),
  );


  export const getModelsForDirectionInTransaction = (transactionEntityManager: Connection.EntityManager, direction: SYNC_DIRECTIONS) => {
    const modelMap = {};
    for (const [modelClass] of transactionEntityManager.connection.entityMetadatasMap) {
      modelMap[modelClass.name] = modelClass;
    }
    return getModelsForDirection(modelMap, direction);
  };