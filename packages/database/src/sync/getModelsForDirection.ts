import { SYNC_DIRECTIONS } from '@tamanu/constants';
import type { SyncSessionDirectionValues } from '../types/sync';
import type { Model } from 'models/Model';

export const getModelsForDirections = (
  models: Record<string, typeof Model>,
  directions: Array<SyncSessionDirectionValues>,
) => {
  return Object.fromEntries(
    Object.entries(models).filter(([, model]) => directions.includes(model.syncDirection)),
  );
};

export const getModelsForPull = (models: Record<string, typeof Model>) =>
  getModelsForDirections(models, [
    SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
    SYNC_DIRECTIONS.BIDIRECTIONAL,
  ]);

export const getModelsForPush = (models: Record<string, typeof Model>) =>
  getModelsForDirections(models, [
    SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
    SYNC_DIRECTIONS.PUSH_TO_CENTRAL_THEN_DELETE,
    SYNC_DIRECTIONS.BIDIRECTIONAL,
  ]);
