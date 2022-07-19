import { SYNC_DIRECTIONS } from 'shared/constants';

export const getModelsForDirection = (models, direction) =>
  Object.fromEntries(
    Object.entries(models).filter(([, model]) =>
      [direction, SYNC_DIRECTIONS.BIDIRECTIONAL].includes(model.syncDirection),
    ),
  );
