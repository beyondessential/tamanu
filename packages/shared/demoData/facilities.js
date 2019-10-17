import { splitIds, mapToSuggestions } from './utils';

export const FACILITIES = splitIds(`
  Balwyn
  Hawthorn East
  Kerang
  Lake Charm
  Marla
  Mont Albert
  National Medical
  Port Douglas
  Swan Hill
  Thornbury
  Traralgon
`);

export const FACILITY_SUGGESTIONS = mapToSuggestions(FACILITIES);
