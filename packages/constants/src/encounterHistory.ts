export const EncounterChangeType = {
  EncounterType: 'encounter_type',
  Location: 'location',
  Department: 'department',
  Examiner: 'examiner',
} as const;
export type EncounterChangeType = typeof EncounterChangeType[keyof typeof EncounterChangeType];
