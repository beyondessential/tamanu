import { ENCOUNTER_TYPES } from '@tamanu/constants';

export const isEmergencyPatient = (encounterType) =>
  [ENCOUNTER_TYPES.EMERGENCY, ENCOUNTER_TYPES.TRIAGE, ENCOUNTER_TYPES.OBSERVATION].includes(
    encounterType,
  );
