import { SYNC_DIRECTIONS } from 'shared/constants';

export const shouldPull = model =>
  model.syncConfig.syncDirection === SYNC_DIRECTIONS.PULL_ONLY ||
  model.syncConfig.syncDirection === SYNC_DIRECTIONS.BIDIRECTIONAL;

export const shouldPush = model =>
  model.syncConfig.syncDirection === SYNC_DIRECTIONS.PUSH_ONLY ||
  model.syncConfig.syncDirection === SYNC_DIRECTIONS.BIDIRECTIONAL;
