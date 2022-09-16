import { SYNC_DIRECTIONS } from 'shared/constants';

export const getModelsForDirection = (models, direction) => {
  const filter = modelSyncDirection => {
    if (direction === SYNC_DIRECTIONS.DO_NOT_SYNC) {
      return modelSyncDirection === SYNC_DIRECTIONS.DO_NOT_SYNC;
    }
    // other sync directions include bidirectional models
    return [direction, SYNC_DIRECTIONS.BIDIRECTIONAL].includes(model.syncDirection);
  };

  return Object.fromEntries(
    Object.entries(models).filter(([, model]) => filter(model.syncDirection)),
  );
};
