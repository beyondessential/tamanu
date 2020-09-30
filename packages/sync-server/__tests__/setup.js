// IMPORTANT NOTE!
// This script is run _before_ the test environment is fully set up,
// crucially the aliases defined in moduleNameMapper will not be available.
// As these aliases are used throughout the codebase, importing any file that
// uses such an alias (or any file that imports such a file, etc) will break
// this setup step.

import { seedLabTests } from 'shared/demoData/labTestTypes';
import { initDatabase } from 'sync-server/app/database';
import { deleteAllTestIds } from './setupUtilities';

import { allSeeds } from './seed';

export default async function() {
  const ctx = initDatabase({
    testMode: true,
  });
  await ctx.sequelize.sync();

  await deleteAllTestIds(ctx);

  // populate with reference data
  const tasks = allSeeds
    .map(d => ({ code: d.name, ...d }))
    .map(d => ctx.models.ReferenceData.create(d));

  await seedLabTests(ctx.models);

  await Promise.all(tasks);
}
