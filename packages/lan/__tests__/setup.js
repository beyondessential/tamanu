import { getTestContext, deleteAllTestIds } from './utilities';
import { expect } from 'jest';

export default async function() {
  const ctx = getTestContext();
  await ctx.sequelize.sync();
  await deleteAllTestIds(ctx);
};
