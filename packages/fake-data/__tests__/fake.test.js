import { fakeStringFields } from '../dist/mjs/fake';

it('should calculate fakeStringFields properly', async () => {
  const fakedObject = fakeStringFields('testPrefix_', ['firstName', 'lastName']);
  expect(fakedObject).toStrictEqual({
    firstName: 'testPrefix_firstName',
    lastName: 'testPrefix_lastName',
  });
});
