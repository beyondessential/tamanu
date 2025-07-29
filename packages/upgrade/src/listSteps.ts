import { promises as fs } from 'node:fs';
import { basename, extname, join } from 'node:path';
import toposort from 'toposort';
import type { MigrationStr, Step, Steps, StepStr } from './step.ts';
import { START, END, MIGRATION_PREFIX, onlyMigrations } from './step.js';

const STEPS_DIR = join(__dirname, 'steps');
export const MIGRATIONS_START = MIGRATION_PREFIX + START;
export const MIGRATIONS_END = MIGRATION_PREFIX + END;

export interface ResolvedStep {
  id: StepStr;
  file: string;
  step: Required<Step>;
}

type Edge = [string, string];

export async function listSteps() {
  const steps: ResolvedStep[] = (
    await Promise.all(
      (await fs.readdir(STEPS_DIR))
        .filter((file: string) => /^\d+-[^.:]+[.][jt]s$/.test(file))
        .sort()
        .map(readStep),
    )
  ).flat();

  const migrations = steps.flatMap(({ step }) =>
    onlyMigrations(step.after).concat(onlyMigrations(step.before)),
  );

  return orderSteps(steps, migrations);
}

/** @internal exported only for testing purposes, use listSteps instead */
export async function orderSteps(steps: ResolvedStep[], migrations: MigrationStr[]) {
  // we build a list of edges in a dependency directed graph:
  // an edge A -> B is represented as [A, B]
  //
  // the goal is to convert the step requirement in the config (at, before, after)
  // to a graph, and then convert that via toposort to a single order of steps to
  // apply.
  //
  // migrations are mixed in only to the extent that they're referenced in the steps,
  // and then in the fixed section added at the end in the concat(), which adds the
  // first and last pending migrations to the ordering. this is because we use a
  // "migrate up to" strategy, instead of running each migration individually.
  //
  // steps and migrations are differentiated by their "step ID", which is upgrade/...
  // for upgrade steps and migration/... for migrations. there's an additional thing
  // where upgrade files can have multiple steps in them, so you can define a pre and
  // a post migration step in the same file if they're related. so upgrade steps IDs
  // have an index suffix, such that in upgrade/filename/N, N is the zero-based index
  // of the step within the file. step relationships must specify an index, not doing
  // so throws immediately.
  //
  // when there are before/after dependencies, the at: START|END specifier *biases*
  // the result but doesn't make it absolute. when there are no before/after deps,
  // then START steps will always be before migrations, and the END steps will
  // always be after migrations.
  const edges: Edge[] = edgeFilter(migrations.map((mig, i) => [migrations[i - 1], mig]))
    .concat(
      steps.flatMap(({ id, step }) => {
        const topo: Edge[] = [];

        if (step.at === START) {
          topo.push([START, id]);
        } else if (step.at === END) {
          topo.push([id, END]);
        }

        for (const need of step.before) {
          topo.push([id, need]);
        }
        for (const need of step.after) {
          topo.push([need, id]);
        }
        if (step.before.length === 0 && step.after.length === 0) {
          if (step.at === START) {
            topo.push([id, MIGRATIONS_START]);
          } else if (step.at === END) {
            topo.push([MIGRATIONS_END, id]);
          }
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

  // we return both the order as a list of step IDs and a mapping of
  // step IDs to step definitions. keeping the order list lightweight
  // probably helps performance marginally, but is also the simplest.
  return {
    order: toposort(edges) as StepStr[],
    steps: new Map(steps.map((step) => [step.id, step])),
  };
}

async function readStep(file: string) {
  const stepfile = basename(file, extname(file));
  const { STEPS }: { STEPS: Steps } = await import(join(STEPS_DIR, file));
  return STEPS.map((step, i) => ({
    id: `upgrade/${stepfile}/${i}` as StepStr,
    file,
    step: {
      before: [],
      after: [],
      check: () => Promise.resolve(true),
      ...step,
    },
  }));
}

function edgeFilter(edges: [string | undefined, string | undefined][]): Edge[] {
  return edges.filter(([a, b]) => a && b) as Edge[];
}
