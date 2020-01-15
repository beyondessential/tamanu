import { getTestContext, deleteAllTestIds } from './utilities';

export default async function() {
  const ctx = getTestContext();
  await deleteAllTestIds(ctx);
};
