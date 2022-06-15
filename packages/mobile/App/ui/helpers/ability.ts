import { AbilityBuilder, Ability, PureAbility } from '@casl/ability';

// Basically a cheap copy of the same function that lives in shared
export function buildAbility(permissions, options = {}): PureAbility {
  const { can, build } = new AbilityBuilder(Ability);

  permissions.forEach(a => {
    if (a.objectId) {
      can(a.verb, a.noun, { id: a.objectId });
    } else {
      can(a.verb, a.noun);
    }
  });

  return build(options);
}
