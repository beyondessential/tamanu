import { ENCOUNTER_TYPES, EncounterChangeType } from '@tamanu/constants';
import { getHospitalAdmissionDate } from './getHospitalAdmissionDate';

describe('getHospitalAdmissionDate', () => {
  it('should return null for non-admission encounters', () => {
    const encounter = {
      encounterType: ENCOUNTER_TYPES.TRIAGE,
      startDate: '2020-01-31 10:35:00',
      encounterHistory: [],
    };
    expect(getHospitalAdmissionDate(encounter)).toBeNull();
  });

  it('should return null for admission encounters without history', () => {
    const encounter = {
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate: '2020-01-31 10:35:00',
      encounterHistory: [],
    };
    expect(getHospitalAdmissionDate(encounter)).toBeNull();
  });

  it('should return null for admission encounters without encounter type change', () => {
    const encounter = {
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate: '2020-01-31 10:35:00',
      encounterHistory: [
        {
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          date: '2020-01-31 10:35:00',
          changeType: null,
        },
      ],
    };
    expect(getHospitalAdmissionDate(encounter)).toBeNull();
  });

  it('should return the admission date for encounters transferred from emergency status', () => {
    const encounter = {
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate: '2020-01-31 10:35:00',
      encounterHistory: [
        {
          encounterType: ENCOUNTER_TYPES.TRIAGE,
          date: '2020-01-31 10:35:00',
          changeType: null,
        },
        {
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          date: '2020-02-01 09:35:00',
          changeType: [EncounterChangeType.EncounterType],
        },
      ],
    };
    expect(getHospitalAdmissionDate(encounter)).toBe('2020-02-01 09:35:00');
  });

  it('should return null if encounter is null', () => {
    expect(getHospitalAdmissionDate(null)).toBeNull();
  });

  it('should return null if encounter is undefined', () => {
    expect(getHospitalAdmissionDate(undefined)).toBeNull();
  });

  it('should handle encounters with multiple type changes', () => {
    const encounter = {
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate: '2020-01-31 10:35:00',
      encounterHistory: [
        {
          encounterType: ENCOUNTER_TYPES.TRIAGE,
          date: '2020-01-31 10:35:00',
          changeType: null,
        },
        {
          encounterType: ENCOUNTER_TYPES.EMERGENCY,
          date: '2020-01-31 15:00:00',
          changeType: [EncounterChangeType.EncounterType],
        },
        {
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          date: '2020-02-01 09:35:00',
          changeType: [EncounterChangeType.EncounterType],
        },
      ],
    };
    expect(getHospitalAdmissionDate(encounter)).toBe('2020-02-01 09:35:00');
  });

  it('should handle encounters with location changes mixed with type changes', () => {
    const encounter = {
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate: '2020-01-31 10:35:00',
      encounterHistory: [
        {
          encounterType: ENCOUNTER_TYPES.TRIAGE,
          date: '2020-01-31 10:35:00',
          changeType: null,
        },
        {
          encounterType: ENCOUNTER_TYPES.TRIAGE,
          date: '2020-01-31 12:00:00',
          changeType: [EncounterChangeType.Location],
        },
        {
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          date: '2020-02-01 09:35:00',
          changeType: [EncounterChangeType.EncounterType, EncounterChangeType.Location],
        },
      ],
    };
    expect(getHospitalAdmissionDate(encounter)).toBe('2020-02-01 09:35:00');
  });
});
