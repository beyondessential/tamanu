import {
  APPOINTMENT_STATUSES,
  IMAGING_REQUEST_STATUS_CONFIG,
  IMAGING_REQUEST_STATUS_TYPES,
  MANNER_OF_DEATH_OPTIONS,
  REPORT_DATA_SOURCE_VALUES,
  REPORT_DATA_SOURCES,
  REPORT_DATE_RANGE_LABELS,
  REPORT_DEFAULT_DATE_RANGES,
} from '@tamanu/constants';

const LAST_30_DAYS_DATE_LABEL = REPORT_DATE_RANGE_LABELS[REPORT_DEFAULT_DATE_RANGES.THIRTY_DAYS];
const ALL_TIME_DATE_LABEL = REPORT_DATE_RANGE_LABELS[REPORT_DEFAULT_DATE_RANGES.ALL_TIME];
export const GENERIC_SURVEY_EXPORT_REPORT_ID = 'generic-survey-export-line-list';

export const REPORT_DEFINITIONS = [
  {
    name: 'Incomplete referrals',
    id: 'incomplete-referrals',
    dateRangeLabel: ALL_TIME_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
    parameters: [{ parameterField: 'VillageField' }, { parameterField: 'PractitionerField' }],
  },
  {
    name: 'Recent Diagnoses',
    id: 'recent-diagnoses',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
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
    name: 'Vaccine - Line list',
    id: 'vaccine-list',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
    parameters: [
      { parameterField: 'VillageField' },
      { parameterField: 'VaccineCategoryField' },
      { parameterField: 'VaccineField' },
    ],
  },
  {
    name: 'Tuvalu Vaccine - Line list with consent',
    id: 'tuvalu-vaccine-list',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
    parameters: [
      { parameterField: 'VillageField' },
      { parameterField: 'VaccineCategoryField' },
      { parameterField: 'VaccineField' },
    ],
  },
  {
    name: 'COVID vaccine campaign - Line list',
    id: 'covid-vaccine-list',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
    parameters: [{ parameterField: 'VillageField' }],
  },
  {
    name: 'COVID vaccine campaign - First dose summary',
    id: 'covid-vaccine-summary-dose1',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
  },
  {
    name: 'COVID vaccine campaign - Second dose summary',
    id: 'covid-vaccine-summary-dose2',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
  },
  {
    name: 'Adverse Event Following Immunization',
    id: 'aefi',
    dateRangeLabel: ALL_TIME_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
    parameters: [{ parameterField: 'VillageField' }],
  },
  {
    name: 'Samoa Adverse Event Following Immunisation',
    id: 'samoa-aefi',
    dateRangeLabel: ALL_TIME_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
    parameters: [{ parameterField: 'VillageField' }],
  },
  {
    name: 'Number of patients registered by date',
    id: 'number-patients-registered-by-date',
    dateRangeLabel: ALL_TIME_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
    // This report queries against column created_at which is a timestamp, not a date
    filterDateRangeAsStrings: false,
  },
  {
    name: 'Registered patients - Line list',
    id: 'registered-patients',
    dateRangeLabel: ALL_TIME_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
    // This report queries against column created_at which is a timestamp, not a date
    filterDateRangeAsStrings: false,
  },
  {
    name: 'COVID-19 Tests - Line list',
    id: 'fiji-covid-swab-lab-test-list',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
    parameters: [{ parameterField: 'VillageField' }, { parameterField: 'LabTestLaboratoryField' }],
  },
  {
    name: 'Fiji Traveller COVID-19 Tests - Line list',
    id: 'fiji-traveller-covid-lab-test-list',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
    parameters: [{ parameterField: 'LabTestLaboratoryField' }],
  },
  {
    name: 'Palau COVID-19 Test - Line list',
    id: 'palau-covid-swab-lab-test-list',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
  },
  {
    name: 'Nauru COVID-19 Test - Line list',
    id: 'nauru-covid-swab-lab-test-list',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
  },
  {
    name: 'Palau COVID-19 Case Report - Line list',
    id: 'palau-covid-case-report-line-list',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
    parameters: [{ parameterField: 'VillageField' }],
  },
  {
    name: 'Kiribati COVID-19 Test - Line list',
    id: 'kiribati-covid-swab-lab-test-list',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
  },
  {
    name: 'Samoa COVID-19 Test - Line list',
    id: 'samoa-covid-swab-lab-test-list',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
    parameters: [{ parameterField: 'VillageField' }, { parameterField: 'LabTestLaboratoryField' }],
  },
  {
    name: 'COVID-19 Tests - Summary',
    id: 'covid-swab-lab-tests-summary',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
    parameters: [{ parameterField: 'VillageField' }, { parameterField: 'LabTestLaboratoryField' }],
  },
  {
    name: 'India assistive technology device - Line list',
    id: 'india-assistive-technology-device-line-list',
    dateRangeLabel: ALL_TIME_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
  },
  {
    name: 'Iraq assistive technology device - Line list',
    id: 'iraq-assistive-technology-device-line-list',
    dateRangeLabel: ALL_TIME_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
  },
  {
    name: 'PNG assistive technology device - Line list',
    id: 'png-assistive-technology-device-line-list',
    dateRangeLabel: ALL_TIME_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
  },
  {
    name: 'Fiji recent attendance - Line list',
    id: 'fiji-recent-attendance-list',
    dateRangeLabel: ALL_TIME_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
    parameters: [
      { parameterField: 'VillageField' },
      { parameterField: 'DiagnosisField', name: 'diagnosis', label: 'Diagnosis' },
    ],
  },
  {
    name: 'Fiji NCD primary screening  - Line list',
    id: 'fiji-ncd-primary-screening-line-list',
    dateRangeLabel: ALL_TIME_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
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
    dateRangeLabel: ALL_TIME_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
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
    dateRangeLabel: ALL_TIME_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
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
    dateRangeLabel: 'Date range (or leave blank for the past 30 days of data)',
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
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
    name: 'Generic Survey Export - Line List',
    id: GENERIC_SURVEY_EXPORT_REPORT_ID,
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
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
    dateRangeLabel: 'Date range (or leave blank for the next 30 days of data)',
    dataSourceOptions: [REPORT_DATA_SOURCES.THIS_FACILITY],
    parameters: [
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Area',
        name: 'locationGroup',
        suggesterEndpoint: 'locationGroup',
        suggesterOptions: { baseQueryParameters: { filterByFacility: true } },
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
        options: Object.values(APPOINTMENT_STATUSES).map((status) => ({
          label: status,
          value: status,
        })),
      },
    ],
  },
  {
    name: 'Imaging requests - Line list',
    id: 'imaging-requests-line-list',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
    parameters: [
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Requesting clinician',
        name: 'requestedById',
        suggesterEndpoint: 'practitioner',
      },
      { parameterField: 'ImagingTypeField' },
      {
        parameterField: 'ParameterMultiselectField',
        label: 'Status',
        name: 'statuses',
        options: Object.values(IMAGING_REQUEST_STATUS_TYPES).map((status) => ({
          label: IMAGING_REQUEST_STATUS_CONFIG[status].label,
          value: status,
        })),
      },
    ],
  },
  {
    name: 'Deceased patients - Line list',
    id: 'deceased-patients-line-list',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
    parameters: [
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Cause of death',
        name: 'causeOfDeath',
        suggesterEndpoint: 'diagnosis',
      },
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Due to (or as a consequence of)',
        name: 'antecedentCause',
        suggesterEndpoint: 'diagnosis',
      },
      {
        parameterField: 'ParameterAutocompleteField',
        label: 'Other contributing condition',
        name: 'otherContributingCondition',
        suggesterEndpoint: 'diagnosis',
      },
      {
        parameterField: 'ParameterSelectField',
        label: 'Manner of death',
        name: 'mannerOfDeath',
        options: MANNER_OF_DEATH_OPTIONS,
      },
    ],
  },
  {
    name: 'Fiji Aspen hospital admissions - Summary',
    id: 'fiji-aspen-hospital-admissions-summary',
    dateRangeLabel: ALL_TIME_DATE_LABEL,
    dataSourceOptions: [REPORT_DATA_SOURCES.THIS_FACILITY],
    parameters: [],
  },
  {
    name: 'Registered births - Line list',
    id: 'registered-births-line-list',
    dateRangeLabel: LAST_30_DAYS_DATE_LABEL,
    dataSourceOptions: REPORT_DATA_SOURCE_VALUES,
    parameters: [{ parameterField: 'VillageField' }],
  },
];
