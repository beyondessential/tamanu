import { getTestContext, deleteAllTestIds } from './utilities';

export default async function() {
  const ctx = getTestContext();
  await ctx.sequelize.sync();
  await deleteAllTestIds(ctx);
}
