import { createTestContext, deleteAllTestIds } from './utilities';

export default async function() {
  const ctx = createTestContext();
  await ctx.sequelize.sync();
  await deleteAllTestIds(ctx);
}
