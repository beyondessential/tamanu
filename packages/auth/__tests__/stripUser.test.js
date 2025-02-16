import { stripUser } from '../dist/cjs/utils';

describe('stripUser', () => {
  it('strips a password from userData', () => {
    const user = {
      username: 'test',
      displayName: 'Test User',
      password: 'password',
    };
    const strippedUser = stripUser(user);
    expect(strippedUser).toEqual({
      username: 'test',
      displayName: 'Test User',
    });
  });
});
