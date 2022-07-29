import { APPOINTMENT_STATUSES } from 'shared/constants';

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
    name: 'Admissions - Line list',
    id: 'admissions',
    parameters: [
      { parameterField: 'PractitionerField' },
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Patient Billing Type',
        name: 'patientBillingType',
        suggesterEndpoint: 'patientBillingType',
      },
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Location',
        name: 'location',
        suggesterEndpoint: 'location',
      },
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Department',
        name: 'department',
        suggesterEndpoint: 'department',
      },
    ],
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
    name: 'Tuvalu Vaccine - Line list with consent',
    id: 'tuvalu-vaccine-list',
    allFacilities: true,
    parameters: [
      { parameterField: 'VillageField' },
      { parameterField: 'VaccineCategoryField' },
      { parameterField: 'VaccineField' },
    ],
  },
  {
    name: 'COVID vaccine campaign - Line list',
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
    allFacilities: true,
  },
  {
    name: 'COVID-19 Tests - Line list',
    id: 'fiji-covid-swab-lab-test-list',
    allFacilities: true,
    parameters: [{ parameterField: 'VillageField' }, { parameterField: 'LabTestLaboratoryField' }],
  },
  {
    name: 'Fiji Traveller COVID-19 Tests - Line list',
    id: 'fiji-traveller-covid-lab-test-list',
    allFacilities: true,
    parameters: [{ parameterField: 'LabTestLaboratoryField' }],
  },
  {
    name: 'Palau COVID-19 Test - Line list',
    id: 'palau-covid-swab-lab-test-list',
    allFacilities: true,
  },
  {
    name: 'Nauru COVID-19 Test - Line list',
    id: 'nauru-covid-swab-lab-test-list',
    allFacilities: true,
  },
  {
    name: 'Palau COVID-19 Case Report - Line list',
    id: 'palau-covid-case-report-line-list',
    allFacilities: true,
    parameters: [{ parameterField: 'VillageField' }],
  },
  {
    name: 'Kiribati COVID-19 Test - Line list',
    id: 'kiribati-covid-swab-lab-test-list',
    allFacilities: true,
  },
  {
    name: 'Samoa COVID-19 Test - Line list',
    id: 'samoa-covid-swab-lab-test-list',
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
  {
    name: 'Fiji recent attendance - Line list',
    id: 'fiji-recent-attendance-list',
    parameters: [
      { parameterField: 'VillageField' },
      { parameterField: 'DiagnosisField', name: 'diagnosis', label: 'Diagnosis' },
    ],
  },
  {
    name: 'Fiji NCD primary screening  - Line list',
    id: 'fiji-ncd-primary-screening-line-list',
    allFacilities: true,
    parameters: [
      {
        parameterField: 'ParameterSelectField',
        name: 'surveyId',
        label: 'Screening type',
        options: [
          {
            label: 'CVD Primary Screening Form',
            value: 'program-fijincdprimaryscreening-fijicvdprimaryscreen2',
          },
          {
            label: 'Breast Cancer Primary Screening Form',
            value: 'program-fijincdprimaryscreening-fijibreastprimaryscreen',
          },
          {
            label: 'Cervical Cancer Primary Screening Form',
            value: 'program-fijincdprimaryscreening-fijicervicalprimaryscreen',
          },
        ],
      },
    ],
  },
  {
    name: 'Fiji NCD primary screening pending referrals - Line list',
    id: 'fiji-ncd-primary-screening-pending-referrals-line-list',
    allFacilities: true,
    parameters: [
      {
        parameterField: 'ParameterSelectField',
        name: 'surveyId',
        label: 'Referral type',
        options: [
          {
            label: 'CVD Primary Screening Referral',
            value: 'program-fijincdprimaryscreening-fijicvdprimaryscreenref',
          },
          {
            label: 'Breast Cancer Primary Screening Referral',
            value: 'program-fijincdprimaryscreening-fijibreastscreenref',
          },
          {
            label: 'Cervical Cancer Primary Screening Referral',
            value: 'program-fijincdprimaryscreening-fijicervicalscreenref',
          },
        ],
      },
    ],
  },
  {
    name: 'Fiji NCD primary screening - Summary',
    id: 'fiji-ncd-primary-screening-summary',
    allFacilities: true,
    parameters: [
      {
        parameterField: 'ParameterMultiselectField',
        name: 'surveyIds',
        label: 'Screening type',
        options: [
          {
            label: 'CVD Primary Screening Form',
            value: 'program-fijincdprimaryscreening-fijicvdprimaryscreen2',
          },
          {
            label: 'Breast Cancer Primary Screening Form',
            value: 'program-fijincdprimaryscreening-fijibreastprimaryscreen',
          },
          {
            label: 'Cervical Cancer Primary Screening Form',
            value: 'program-fijincdprimaryscreening-fijicervicalprimaryscreen',
          },
        ],
      },
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Division',
        name: 'division',
        suggesterEndpoint: 'division',
      },
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Medical Area',
        name: 'medicalArea',
        suggesterEndpoint: 'medicalArea',
      },
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Nursing Zone',
        name: 'nursingZone',
        suggesterEndpoint: 'nursingZone',
      },
      { parameterField: 'VillageField' },
    ],
  },
  {
    name: 'Fiji Statistical Report for PHIS - Summary',
    id: 'fiji-statistical-report-for-phis-summary',
    allFacilities: true,
    parameters: [
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Division',
        name: 'division',
        suggesterEndpoint: 'division',
      },
      { parameterField: 'VillageField' },
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Medical Area',
        name: 'medicalArea',
        suggesterEndpoint: 'medicalArea',
      },
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Nursing Zone',
        name: 'nursingZone',
        suggesterEndpoint: 'nursingZone',
      },
    ],
  },
  {
    name: 'Fiji Aspen encounter summary - Line list',
    id: 'fiji-aspen-encounter-summary-line-list',
    allFacilities: false,
    parameters: [
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Patient Billing Type',
        name: 'patientBillingType',
        suggesterEndpoint: 'patientBillingType',
      },
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Department',
        name: 'department',
        suggesterEndpoint: 'department',
      },
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Location',
        name: 'location',
        suggesterEndpoint: 'location',
      },
    ],
  },
  {
    name: 'Generic Survey Export - Line List',
    id: 'generic-survey-export-line-list',
    parameters: [
      { parameterField: 'VillageField' },
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Survey',
        name: 'surveyId',
        suggesterEndpoint: 'survey',
        required: true,
      },
    ],
  },
  {
    name: 'Appointments - Line list',
    id: 'appointments-line-list',
    parameters: [
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Location',
        name: 'location',
        suggesterEndpoint: 'location',
      },
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Clinician',
        name: 'clinician',
        suggesterEndpoint: 'practitioner',
      },
      {
        parameterField: 'ParameterSelectField',
        name: 'appointmentStatus',
        label: 'Appointment Status',
        options: Object.values(APPOINTMENT_STATUSES).map(status => ({
          label: status,
          value: status,
        })),
      },
    ],
  },
];
