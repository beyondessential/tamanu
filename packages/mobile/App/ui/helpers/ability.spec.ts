import { buildAbility } from './ability';

describe('Permissions', () => {
  const testPermissions = [
    { verb: 'someVerb', noun: 'someNoun' },
    { verb: 'anotherVerb', noun: 'anotherNoun' },
  ];

  it('Should forbid any user without specific permission', async () => {
    const user = { role: 'reception' };
    const ability = buildAbility(user, testPermissions);
    const hasPermission = ability.can('fakeVerb', 'FakeNoun');
    expect(hasPermission).toBe(false);
  });

  it('Should grant every permission to the superadmin', async () => {
    const user = { role: 'admin' };
    const ability = buildAbility(user, testPermissions);
    const hasPermission = ability.can('fakeVerb', 'FakeNoun');
    expect(hasPermission).toBe(true);
  });
});
