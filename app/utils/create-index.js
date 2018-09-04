export default async (mainDB) => {
  try {
    await _createIndex(mainDB, ['displayId']);
    await _createIndex(mainDB, ['firstName']);
    await _createIndex(mainDB, ['lastName']);
    await _createIndex(mainDB, ['docType']);
    await _createIndex(mainDB, ['sex']);
  } catch (err) {
    console.error(err);
  }
};

const _createIndex = async (mainDB, fields) => {
  try {
    const res = await mainDB.createIndex({
      index: { fields }
    });
    return res;
  } catch (err) {
    return Promise.reject(err);
  }
}
