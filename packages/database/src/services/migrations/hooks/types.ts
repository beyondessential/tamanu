import type { Sequelize } from 'sequelize';
import type { Logger } from 'winston';

export interface HookContext {
  log: Logger;
  sequelize: Sequelize;
}

/** Returns true if the hook should run; all must be true for the hook to run. */
export type Prerequisite = (context: HookContext) => Promise<boolean>;

export interface MigrationHook {
  name: string;
  prerequisites: Prerequisite[];
  run: (context: HookContext) => Promise<void>;
}
