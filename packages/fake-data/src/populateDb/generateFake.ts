import type { Models } from '@tamanu/database';

import { generateEachDataType } from './generateEachDataType.js';
import { populateDbFromTallyFile } from './parseTally/populateFromLogTally.js';

/** Generate fake data to exercise the whole database */
export async function generateFake(
  models: Models,
  rounds: number = 1,
  tallyFilePath?: string,
): Promise<void> {
  if (!Number.isInteger(rounds) || rounds < 1) {
    throw new Error(`rounds must be a positive integer, got ${rounds}`);
  }

  console.log('Fill database with fake data', rounds, 'rounds');
  if (tallyFilePath) console.log('Using tally file:', tallyFilePath);

  let done = 0;
  let errs = 0;
  while (done < rounds && errs < Math.max(10, rounds / 10)) {
    try {
      if (tallyFilePath) {
        await populateDbFromTallyFile(models, tallyFilePath);
        done += 1;
      } else {
        await generateEachDataType(models);
        done += 1;
      }
      process.stdout.write('.');
    } catch (err) {
      // A tally round is not retried, so swallowing its failure would leave the run
      // reporting success on a database it never wrote to.
      if (tallyFilePath) throw err;
      console.error(err);
      process.stdout.write('!');
      errs += 1;
    }
  }

  if (done < rounds && errs > 0) {
    throw new Error('encountered too many errors');
  }

  console.log();
}
