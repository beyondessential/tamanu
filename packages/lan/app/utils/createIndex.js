module.exports = async (mainDB) => {
  try {
    await mainDB.createIndex({
      index: {
        fields: ['displayId']
      }
    });
  } catch (err) {
    console.error(err);
  }
};
