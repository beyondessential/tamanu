import { randomInt } from 'node:crypto';

// The test seed drives every value @tamanu/fake-data generates (it seeds the shared `chance`
// instance with it), so a data-dependent failure is only reproducible if the run tells you
// which seed it used. Resolve it once here in the Vitest node process, put it back into the
// environment so each worker the pool forks inherits the same value, and print it.
//
// Re-run a failing suite with `TAMANU_TEST_SEED=<n> npm test` to get the same data. This is
// ours rather than the runner's: Vitest's own `getSeed()` is a node-side API that returns
// null unless test ordering is randomised, so it can't serve this purpose.

const fromEnvironment = process.env.TAMANU_TEST_SEED?.trim();

// A seed of `0` must survive, so test for emptiness rather than falsiness of the number.
export const testSeed = fromEnvironment ? Number(fromEnvironment) : randomInt(2 ** 42);

if (!Number.isInteger(testSeed)) {
  throw new Error(`TAMANU_TEST_SEED must be an integer, got "${fromEnvironment}"`);
}

process.env.TAMANU_TEST_SEED = String(testSeed);

if (!fromEnvironment) {
  console.log(`Test seed: ${testSeed} (re-run with TAMANU_TEST_SEED=${testSeed} to reproduce)`);
}
