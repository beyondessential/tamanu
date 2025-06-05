import { promises as fs } from 'node:fs';
import { basename, extname, join } from 'node:path';
import pLimit from 'p-limit';
import toposort from 'toposort';
import type { Steps } from './step.ts';
export type * from './step.ts';

const STEPS_DIR = join(__dirname, 'steps');

export const START = ':start:';
export const END = ':end:';
export const MIGRATION_PREFIX = 'migration:';

export async function listSteps() {
  const limit = pLimit(10);
  const steps = (
    await Promise.all(
      (await fs.readdir(STEPS_DIR))
        .filter((file: string) => /^\d+-[^.:]+[.][jt]s$/.test(file))
        .map((file: string) =>
          limit(async () => {
            const stepfile = basename(file, extname(file));
            const { STEPS }: { STEPS: Steps } = await import(join(STEPS_DIR, file));
            return STEPS.map((step, i) => ({
              id: `${stepfile}:${i}`,
              file: stepfile,
              step,
            }));
          }),
        ),
    )
  ).flat();

  const beforeAlls = steps.filter(({ step }) => Object.hasOwnProperty.call(step, 'beforeAll'));
  const afterAlls = steps.filter(({ step }) => Object.hasOwnProperty.call(step, 'afterAll'));
  const beforeSteps = steps.filter(({ step }) => Object.hasOwnProperty.call(step, 'beforeStep'));
  const afterSteps = steps.filter(({ step }) => Object.hasOwnProperty.call(step, 'afterStep'));
  const beforeMigrations = steps.filter(({ step }) =>
    Object.hasOwnProperty.call(step, 'beforeMigration'),
  );
  const afterMigrations = steps.filter(({ step }) =>
    Object.hasOwnProperty.call(step, 'afterMigration'),
  );

  const migrations = beforeMigrations
    .map(({ step }) => `${MIGRATION_PREFIX}${(step as any)['beforeMigration']}`)
    .concat(
      afterMigrations.map(({ step }) => `${MIGRATION_PREFIX}${(step as any)['afterMigration']}`),
    )
    .sort();

  const topo: [string, string][] = edgeFilter(migrations.map((id, i) => [migrations[i - 1], id]))
    .concat(
      beforeAlls.flatMap(({ id, file }): [string, string][] => [
        [START, id],
        [file, id],
      ]),
    )
    .concat(
      afterAlls.flatMap(({ id, file }): [string, string][] => [
        [id, END],
        [file, id],
      ]),
    )
    .concat(
      beforeSteps.flatMap(({ id, file, step }): [string, string][] => [
        [id, (step as any)['beforeStep'] as string],
        [file, id],
      ]),
    )
    .concat(
      afterSteps.flatMap(({ id, file, step }): [string, string][] => [
        [(step as any)['afterStep'] as string, id],
        [file, id],
      ]),
    )
    .concat(
      beforeMigrations.flatMap(({ id, file, step }): [string, string][] => [
        [id, `${MIGRATION_PREFIX}${(step as any)['beforeMigration']}`],
        [file, id],
        [`${START}mig`, file],
        [file, `${END}mig`],
      ]),
    )
    .concat(
      afterMigrations.flatMap(({ id, file, step }): [string, string][] => [
        [`${MIGRATION_PREFIX}${(step as any)['afterMigration']}`, id],
        [file, id],
        [`${START}mig`, file],
        [file, `${END}mig`],
      ]),
    )
    .concat(
      edgeFilter([
        [START, END],
        [START, `${START}mig`],
        [`${START}mig`, migrations[0]],
        [migrations[migrations.length - 1], `${END}mig`],
        [`${END}mig`, END],
      ]),
    );

  return {
    order: toposort(topo).reverse(),
    steps: new Map(steps.map((step) => [step.id, step])),
  };
}

function edgeFilter(edges: [string | undefined, string | undefined][]): [string, string][] {
  return edges.filter(([a, b]) => a && b) as [string, string][];
}
