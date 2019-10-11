import { schemas } from 'Shared/schemas';

const TEST_ID_PREFIX = 'test_';

function deleteTestObjects(db, objectType, primaryKey) {
  return db.write(() => {
    const testObjects = db
      .objects(objectType)
      .filtered(`${primaryKey} BEGINSWITH $0`, TEST_ID_PREFIX);
    db.delete(testObjects);
  });
}

export function clearTestData(db) {
  schemas.forEach(({ name: objectType, primaryKey }) => {
    deleteTestObjects(db, objectType, primaryKey);
  });
}

export function generateTestId() {
  return `${TEST_ID_PREFIX}${jest.requireActual('shortid').generate()}`; //eslint-disable-line no-undef
}
