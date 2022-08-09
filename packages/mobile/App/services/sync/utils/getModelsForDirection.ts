import { SYNC_DIRECTIONS } from '../../../models/constants';
import { MODELS_MAP } from '~/models/modelsMap';

export const getModelsForDirection = (
  models: typeof MODELS_MAP,
  direction: SYNC_DIRECTIONS,
): typeof MODELS_MAP =>  Object.fromEntries(
    Object.entries(models).filter(
      ([, model]) => [direction, SYNC_DIRECTIONS.BIDIRECTIONAL].includes(model.syncDirection),
    ),
  );
