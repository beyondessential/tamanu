import { v4 as uuid } from 'uuid';

// make a 'fake' uuid that looks like 'abcd7766-9794-4491-8612-eb19fd959bf2'
// (n.b. the prefix is chosen because it's obviously fake, but valid hexadecimal)
// this way we can run tests against real data and clear out everything that was
// created by the tests with just "DELETE FROM table WHERE id LIKE 'abcd%'"
const makeTestUUID = () => `abcd${uuid().slice(4)}`;

export const getUUIDGenerator = testMode => (testMode ? makeTestUUID : uuid);
