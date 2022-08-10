import { AbilityBuilder, Ability, PureAbility } from '@casl/ability';

// Basically a cheap copy of the same function that lives in shared
export function buildAbility(userData, permissions, options = {}): PureAbility {
  const { can, build } = new AbilityBuilder(Ability);

  if (userData.role === 'admin') {
    can('manage', 'all');
  } else {
    permissions.forEach(a => {
      if (a.objectId) {
        can(a.verb, a.noun, { id: a.objectId });
      } else {
        can(a.verb, a.noun);
      }
    });
  }

  return build(options);
}
