import { splitIds, mapToSuggestions } from './utils';

const buildUser = u => ({
  ...u,
  displayName: u.name,
  email: `${u._id}@xyz.com`,
});
export const PRACTITIONERS = splitIds(`
  Dr Philip Rogers
  Dr Salvatore Mathis
  Dr Billy Faulkner
  Dr Davis Morales
  Dr Jacquelyn Kirby
  Dr Evelin Cortez
  Dr Hana Pitts
  Dr Melody Moon
  Dr Aiyana Stewart
  Johnathan Dixon
  Kinley Farmer
  Karla Jenkins
  Mikayla Hull
  Marissa Bautista
`).map(buildUser);

export const PRACTITIONER_SUGGESTIONS = mapToSuggestions(PRACTITIONERS);
