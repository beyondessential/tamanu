export const REPORT_OPTION_TYPES = [
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
    name: 'COVID vaccine campaign line list',
    id: 'covid-vaccine-list',
    parameters: [{ parameterField: 'VillageField' }],
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
];
