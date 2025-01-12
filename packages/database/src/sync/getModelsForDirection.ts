import { SYNC_DIRECTIONS } from '@tamanu/constants';
import type { Models } from '../types/model';
import type { SyncDirectionValues, SyncSessionDirectionValues } from '../types/sync';

export const getModelsForDirection = (models: Models, direction: SyncSessionDirectionValues) => {
  const filter = (modelSyncDirection: SyncDirectionValues) => {
    if (direction === SYNC_DIRECTIONS.DO_NOT_SYNC) {
      return modelSyncDirection === SYNC_DIRECTIONS.DO_NOT_SYNC;
    }
    // other sync directions include bidirectional models
    return [direction, SYNC_DIRECTIONS.BIDIRECTIONAL].includes(modelSyncDirection);
  };

  return Object.fromEntries(
    Object.entries(models).filter(([, model]) => filter(model.syncDirection)),
  );
};
