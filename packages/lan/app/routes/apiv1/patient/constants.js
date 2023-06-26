export const PATIENT_SORT_KEYS = {
  markedForSync: 'patient_facilities.patient_id',
  displayId: 'patients.display_id',
  lastName: 'UPPER(patients.last_name)',
  culturalName: `UPPER(COALESCE(patients.cultural_name, ''))`,
  firstName: 'UPPER(patients.first_name)',
  age: 'patients.date_of_birth',
  dateOfBirth: 'patients.date_of_birth',
  villageName: 'village_name',
  locationName: 'location.name',
  departmentName: 'department.name',
  encounterType: 'encounters.encounter_type',
  sex: 'patients.sex',
};
