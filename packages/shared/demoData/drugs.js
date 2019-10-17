import { splitIds, mapToSuggestions } from './utils';

export const DRUGS = splitIds(`
  Hydrocodone
  Simvastatin
  Lisinopril
  Levothyroxine
  Amlodipine besylate
  Omeprazole
  Azithromycin
  Amoxicillin
  Metformin
  Hydrochlorothiazide
`);

export const DRUG_SUGGESTIONS = mapToSuggestions(DRUGS);
