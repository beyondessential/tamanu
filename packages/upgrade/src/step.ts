import type { Models, Sequelize } from '@tamanu/database';
import type { Logger } from 'winston';

export interface StepArgs {
  sequelize: Sequelize;
  models: Models;
  log: Logger;
  fromVersion: string;
  toVersion: string;
  serverType: 'central' | 'facility';
}

export type StepRequirement =
  | { beforeAll: true }
  | { afterAll: true }
  | { beforeStep: string }
  | { afterStep: string }
  | { beforeMigration: string }
  | { afterMigration: string };

export type StepMeta = {
  description?: string;
  check?: (args: StepArgs) => Promise<boolean>;
  run: (args: StepArgs) => Promise<void>;
};

export type Step = StepRequirement & StepMeta;

export type Steps = Step[];
