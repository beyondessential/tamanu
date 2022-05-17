import { AbilityBuilder, Ability } from '@casl/ability';

export function buildAbility(permissions, options = {}) {
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

// allows us to pass in objects with a "type" key
// (in production - and by default - subject type will be derived
// from the class name, in the same way that sequelize does it)
export function buildAbilityForTests(permissions) {
  return buildAbility(permissions, {
    detectSubjectType: obj => {
      if (typeof obj === 'string') {
        return obj;
      }
      return obj?.type;
    },
  });
}
