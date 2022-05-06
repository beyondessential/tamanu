import { v4 as uuid } from 'uuid';

// make a 'fake' uuid that looks like 'test-766-9794-4491-8612-eb19fd959bf2'
// this way we can run tests against real data and clear out everything that was
// created by the tests with just "DELETE FROM table WHERE id LIKE 'test-%'"
const makeTestUUID = () => `test-${uuid().slice(5)}`;

export const getUUIDGenerator = testMode => (testMode ? makeTestUUID : uuid);
