import { createContext } from 'react'
import { createContextualCan } from '@casl/react'
import { Ability } from '@casl/ability'
import { store } from '../store';

export const AbilityContext = createContext()
export const Can = () => {
  const state = store.getState();
  const { auth } = state;
  if (auth.abilities && typeof auth.abilities !== 'object') auth.abilities = JSON.parse(auth.abilities);
  return createContextualCan(auth.abilities);
}

export const checkAbility = ({ action, subject }) => {
  const abilities = getAbilities();
  const ability = new Ability(abilities);
  return ability.can(action, subject);
}

export const getAbilities = () => {
  const state = store.getState();
  const { auth } = state;
  let { abilities = [] } = auth;
  if (typeof abilities !== 'object') {
    abilities = JSON.parse(abilities);
  }
  return abilities;
}
