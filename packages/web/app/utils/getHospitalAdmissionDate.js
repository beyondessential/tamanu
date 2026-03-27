import { ENCOUNTER_TYPES, EncounterChangeType } from '@tamanu/constants';

/**
 * Gets the hospital admission date from encounter history for encounters
 * that were transferred from emergency status to hospital admission.
 *
 * @param {Object} encounter - The encounter object
 * @returns {string|null} - The hospital admission date or null if not applicable
 */
export const getHospitalAdmissionDate = encounter => {
  if (!encounter || encounter.encounterType !== ENCOUNTER_TYPES.ADMISSION) {
    return null;
  }

  const encounterHistory = encounter.encounterHistory || [];
  if (encounterHistory.length === 0) {
    return null;
  }

  // Find the history record where the encounter type changed to ADMISSION
  const admissionHistory = encounterHistory.find(
    history =>
      history.encounterType === ENCOUNTER_TYPES.ADMISSION &&
      history.changeType?.includes(EncounterChangeType.EncounterType),
  );

  return admissionHistory?.date || null;
};
