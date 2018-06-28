export default async (mainDB) => {
  try {
    console.log('mainDB', mainDB.createIndex);
    await mainDB.createIndex({
      index: {
        fields: ['displayId']
      }
    });
  } catch (err) {
    console.error(err);
  }
};
