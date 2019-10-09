import shortid from 'shortid';

const TEST_ID_PREFIX = 'test_';

function deleteTestObjects(db, objectType) {
  return db.write(() => {
    const testObjects = db.objects(objectType).filtered('_id BEGINSWITH $0', TEST_ID_PREFIX);
    db.delete(testObjects);
  });
}

export function clearTestData(db) {
  deleteTestObjects(db, 'location');
}

export function generateTestId() {
  return `${TEST_ID_PREFIX}${shortid.generate()}`;
}
