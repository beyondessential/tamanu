import { splitIds, mapToSuggestions } from './utils';

export const LOCATIONS = splitIds(`
  Ward 1
  Ward 2
  Ward 3
  Ward 4
  Emergency
`);

export const LOCATION_SUGGESTIONS = mapToSuggestions(LOCATIONS);
