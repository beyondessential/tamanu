import shortid from 'shortid';
import { schemas } from 'Shared/schemas';

const TEST_ID_PREFIX = 'test_';

function deleteTestObjects(db, objectType) {
  return db.write(() => {
    const testObjects = db.objects(objectType).filtered('_id BEGINSWITH $0', TEST_ID_PREFIX);
    db.delete(testObjects);
  });
}

export function clearTestData(db) {
  schemas.forEach(({ name: objectType }) => deleteTestObjects(db, objectType));
}

export function generateTestId() {
  return `${TEST_ID_PREFIX}${shortid.generate()}`;
}
