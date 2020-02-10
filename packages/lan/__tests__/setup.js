import { createTestContext, deleteAllTestIds } from './utilities';
import { allSeeds } from './seed';

export default async function() {
  const ctx = createTestContext();
  await ctx.sequelize.sync();
  await deleteAllTestIds(ctx);

  // populate with reference data
  const tasks = allSeeds
    .map(d => ctx.models.ReferenceData.create(d));
  await Promise.all(tasks);
}
