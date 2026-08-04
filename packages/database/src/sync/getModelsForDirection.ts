import { SYNC_DIRECTIONS } from '@tamanu/constants';
import type { SyncPhaseValues, SyncSessionDirectionValues } from '../types/sync';
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

// the models whose own phase of a facility's first sync is this one
export const getModelsForPullPhase = (
  models: Record<string, typeof Model>,
  phase: SyncPhaseValues,
) =>
  Object.fromEntries(
    Object.entries(getModelsForPull(models)).filter(
      ([, model]) => model.initialSyncPhase === phase,
    ),
  );

// every model a phase of a facility's first sync pulls: its own, plus the earlier phases' models,
// which it catches up from where the phase before it stopped
export const getModelsForPullThroughPhase = (
  models: Record<string, typeof Model>,
  phase: SyncPhaseValues,
) =>
  Object.fromEntries(
    Object.entries(getModelsForPull(models)).filter(([, model]) => model.initialSyncPhase <= phase),
  );

export const getModelsForPush = (models: Record<string, typeof Model>) =>
  getModelsForDirections(models, [
    SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
    SYNC_DIRECTIONS.PUSH_TO_CENTRAL_THEN_DELETE,
    SYNC_DIRECTIONS.BIDIRECTIONAL,
  ]);
