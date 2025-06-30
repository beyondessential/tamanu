import { basename, extname } from 'node:path';
import type { Models, Sequelize } from '@tamanu/database';
import type { Logger } from 'winston';

export type At = ':start:' | ':end:';
export const START: At = ':start:';
export const END: At = ':end:';
export const MIGRATION_PREFIX = 'migration/';
export const STEP_PREFIX = 'upgrade/';

export type StepStr = `upgrade/${string}/${number}`;
export type MigrationStr = `migration/${string}`;
export type Need = StepStr | MigrationStr;
export type Needs = Need[];

export const needsStep = (step: string) => {
  const re = /^(?<file>.+?)(\/(?<index>\d+))?$/;
  const { file, index } = re.exec(step)?.groups || {};
  if (!file) throw new Error(`Invalid step name: ${step}`);
  if (!index) throw new Error('You must provide an index when depending on upgrade steps');

  return `upgrade/${basename(file, extname(file))}/${index}` as StepStr;
};
export const needsMigration = (mig: string) =>
  `migration/${basename(mig, extname(mig))}` as MigrationStr;
export const onlySteps = (needs: Needs): StepStr[] =>
  needs.filter((need: Need) => need.startsWith(STEP_PREFIX)) as StepStr[];
export const onlyMigrations = (needs: Needs): MigrationStr[] =>
  needs.filter((need: Need) => need.startsWith(MIGRATION_PREFIX)) as MigrationStr[];
export const stepFile = (str: StepStr) => str.split('/')[1] + '.js';
export const migrationFile = (str: MigrationStr) => str.split('/')[1] + '.js';

export interface StepArgs {
  sequelize: Sequelize;
  models: Models;
  log: Logger;
  fromVersion: string;
  toVersion: string;
  serverType: 'central' | 'facility';
}

export interface Step {
  at: At;
  before?: Needs;
  after?: Needs;
  check?: (args: StepArgs) => Promise<boolean>;
  run: (args: StepArgs) => Promise<void>;
}

export type Steps = Step[];
