export const REPORT_DEFINITIONS = [
  {
    name: 'Incomplete referrals',
    id: 'incomplete-referrals',
    parameters: [{ parameterField: 'VillageField' }, { parameterField: 'PractitionerField' }],
  },
  {
    name: 'Recent Diagnoses',
    id: 'recent-diagnoses',
    parameters: [
      {
        parameterField: 'DiagnosisField',
        required: true,
        name: 'diagnosis',
        label: 'Diagnosis',
      },
      { parameterField: 'DiagnosisField', name: 'diagnosis2', label: 'Diagnosis 2' },
      { parameterField: 'DiagnosisField', name: 'diagnosis3', label: 'Diagnosis 3' },
      { parameterField: 'DiagnosisField', name: 'diagnosis4', label: 'Diagnosis 4' },
      { parameterField: 'DiagnosisField', name: 'diagnosis5', label: 'Diagnosis 5' },
      { parameterField: 'EmptyField' },
      { parameterField: 'VillageField' },
      { parameterField: 'PractitionerField' },
    ],
  },
  {
    name: 'Admissions Report',
    id: 'admissions',
    parameters: [{ parameterField: 'PractitionerField' }],
  },
  {
    name: 'Vaccine - Line list',
    id: 'vaccine-list',
    parameters: [
      { parameterField: 'VillageField' },
      { parameterField: 'VaccineCategoryField' },
      { parameterField: 'VaccineField' },
    ],
  },
  {
    name: 'COVID vaccine campaign - First dose summary',
    id: 'covid-vaccine-summary-dose1',
    allFacilities: true,
  },
  {
    name: 'COVID vaccine campaign - Second dose summary',
    id: 'covid-vaccine-summary-dose2',
    allFacilities: true,
  },
  {
    name: 'Adverse Event Following Immunization',
    id: 'aefi',
    parameters: [{ parameterField: 'VillageField' }],
  },
  {
    name: 'Samoa Adverse Event Following Immunisation',
    id: 'samoa-aefi',
    parameters: [{ parameterField: 'VillageField' }],
  },
  {
    name: 'Number of patients registered by date',
    id: 'number-patients-registered-by-date',
    allFacilities: true,
  },
  {
    name: 'Registered patients - Line list',
    id: 'registered-patients',
    allFacilities: true,
  },
  {
    name: 'COVID-19 Tests - Line list',
    id: 'covid-swab-lab-test-list',
    allFacilities: true,
    parameters: [{ parameterField: 'VillageField' }, { parameterField: 'LabTestLaboratoryField' }],
  },
  {
    name: 'COVID-19 Tests - Summary',
    id: 'covid-swab-lab-tests-summary',
    parameters: [{ parameterField: 'VillageField' }, { parameterField: 'LabTestLaboratoryField' }],
  },
  {
    name: 'India assistive technology device - Line list',
    id: 'india-assistive-technology-device-line-list',
  },
  {
    name: 'Iraq assistive technology device - Line list',
    id: 'iraq-assistive-technology-device-line-list',
  },
  {
    name: 'PNG assistive technology device - Line list',
    id: 'png-assistive-technology-device-line-list',
  },
];
