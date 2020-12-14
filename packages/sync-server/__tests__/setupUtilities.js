
export async function deleteTestData({ store }) {
  console.log("Deleting test data...");
  const removed = await store.removeAllOfType('test');
  console.log(`Removed ${removed} records`);
}
