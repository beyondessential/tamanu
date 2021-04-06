import { SYNC_DIRECTIONS } from 'shared/constants';

export const shouldPull = model =>
  model.syncDirection === SYNC_DIRECTIONS.PULL_ONLY ||
  model.syncDirection === SYNC_DIRECTIONS.BIDIRECTIONAL;

export const shouldPush = model =>
  model.syncDirection === SYNC_DIRECTIONS.PUSH_ONLY ||
  model.syncDirection === SYNC_DIRECTIONS.BIDIRECTIONAL;
