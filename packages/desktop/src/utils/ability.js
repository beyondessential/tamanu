// TODO once abilities are working again, uncomment this
/*
import { Ability } from '@casl/ability';
export const checkAbility = ({ action, subject, field }) => {
  const abilities = getAbilities();
  const ability = new Ability(abilities);
  return ability.can(action, subject, field);
};
*/

export const checkAbility = () => true;

export const getAbilities = () => {
  const state = { auth: {} }; // TODO return to using store.getState();
  const { auth } = state;
  let { abilities = [] } = auth;
  if (typeof abilities !== 'object') {
    abilities = JSON.parse(abilities);
  }
  return abilities;
};
