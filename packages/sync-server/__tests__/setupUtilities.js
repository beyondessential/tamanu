
export async function deleteTestData({ store }) {
  console.log("Deleting test data...");

  // TODO: remove data from ALL channels
  const removed = await store.remove('TODO', { 
    recordType: 'test',
  });

  console.log(`Removed ${removed} records`);
}
