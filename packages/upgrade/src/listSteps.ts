import { promises as fs } from 'node:fs';
import { basename, extname, join } from 'node:path';
import toposort from 'toposort';
import type { Step, Steps, StepStr } from './step.ts';
import { START, END, MIGRATION_PREFIX, onlyMigrations } from './step.js';

const STEPS_DIR = join(__dirname, 'steps');
export const MIGRATIONS_START = MIGRATION_PREFIX + START;
export const MIGRATIONS_END = MIGRATION_PREFIX + END;

export interface ResolvedStep {
  id: StepStr;
  file: StepStr;
  step: Required<Step>;
}

type Edge = [string, string];

export async function listSteps() {
  const steps: ResolvedStep[] = (
    await Promise.all(
      (await fs.readdir(STEPS_DIR))
        .filter((file: string) => /^\d+-[^.:]+[.][jt]s$/.test(file))
        .sort()
        .map(async (file: string) => {
          const stepfile = basename(file, extname(file));
          const { STEPS }: { STEPS: Steps } = await import(join(STEPS_DIR, file));
          return STEPS.map((step, i) => ({
            id: `upgrade/${stepfile}/${i}` as StepStr,
            file: `upgrade/${stepfile}` as StepStr,
            step: {
              before: [],
              after: [],
              check: () => Promise.resolve(true),
              ...step,
            },
          }));
        }),
    )
  ).flat();

  const migrations = steps.flatMap(({ step }) =>
    onlyMigrations(step.after).concat(onlyMigrations(step.before)),
  );

  const edges: Edge[] = edgeFilter(migrations.map((mig, i) => [migrations[i - 1], mig]))
    .concat(
      steps.flatMap(({ file, id, step }) => {
        const topo: Edge[] = [];

        if (step.at === START) {
          topo.push([START, id], [file, id]);
        } else if (step.at === END) {
          topo.push([id, END], [file, id]);
        }

        for (const need of step.before) {
          topo.push([id, need]);
        }
        for (const need of step.after) {
          topo.push([need, id]);
        }

        return topo;
      }),
    )
    .concat(
      edgeFilter([
        [START, END],
        [START, MIGRATIONS_START],
        [MIGRATIONS_START, migrations[0]],
        [migrations[migrations.length - 1], MIGRATIONS_END],
        [MIGRATIONS_END, END],
      ]),
    );

  return {
    order: toposort(edges).reverse() as StepStr[],
    steps: new Map(steps.map((step) => [step.id, step])),
  };
}

function edgeFilter(edges: [string | undefined, string | undefined][]): Edge[] {
  return edges.filter(([a, b]) => a && b) as Edge[];
}
