import { Ability } from '@casl/ability';
import { store } from '../store';

export const checkAbility = ({ action, subject, field }) => {
  const abilities = getAbilities();
  const ability = new Ability(abilities);
  return ability.can(action, subject, field);
};

export const getAbilities = () => {
  const state = store.getState();
  const { auth } = state;
  let { abilities = [] } = auth;
  if (typeof abilities !== 'object') {
    abilities = JSON.parse(abilities);
  }
  return abilities;
};
