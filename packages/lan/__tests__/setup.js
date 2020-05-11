import { seedLabTests } from 'shared/demoData/labTestTypes';
import { initDatabase } from 'lan/app/database';
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
