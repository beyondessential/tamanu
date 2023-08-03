import { Role, TamanuApi } from '../TamanuApi.js';
import { ActivityConstructor } from './Activity.js';

export interface Context {
  api: TamanuApi;
  store: Map<string, unknown>;
  role?: Role;
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

export type CallArgs = Record<string, unknown>;
export interface Call {
  player: OneOf | AllOf;
  Activity: ActivityConstructor;
  args: CallArgs;
}
