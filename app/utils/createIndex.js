module.exports = async (mainDB) => {
  try {
    await mainDB.createIndexAsync({
      index: {
        fields: ['displayId']
      }
    });
  } catch (err) {
    console.error(err);
  }
};
