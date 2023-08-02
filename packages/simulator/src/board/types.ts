import { TamanuApi } from '@tamanu/api-client';
import { Activity } from './Activity.js';

export interface Context {
  api: TamanuApi;
  store: Map<string, unknown>;
}

export function makeContext(context: Omit<Context, 'store'>): Context {
  return {
    ...context,
    store: new Map(),
  };
}

export interface OneOf {
  kind: 'one';
  type: string;
}

export interface AllOf {
  kind: 'all';
  type: string;
}

export interface Call {
  player: OneOf | AllOf;
  activity: Activity;
}
