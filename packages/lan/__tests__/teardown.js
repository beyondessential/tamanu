import { createTestContext, deleteAllTestIds } from './utilities';

export default async function() {
  const ctx = createTestContext();
  await deleteAllTestIds(ctx);
}
