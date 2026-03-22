import {
  REPORT_DATA_SOURCE_VALUES,
  REPORT_DATE_RANGE_LABELS,
  REPORT_DEFAULT_DATE_RANGES,
} from '@tamanu/constants';

export const GENERIC_SURVEY_EXPORT_REPORT_ID = 'generic-survey-export-line-list';

export const REPORT_DEFINITIONS = [
  {
    name: 'Generic Survey Export - Line List',
    id: GENERIC_SURVEY_EXPORT_REPORT_ID,
    dateRangeLabel: REPORT_DATE_RANGE_LABELS[REPORT_DEFAULT_DATE_RANGES.THIRTY_DAYS],
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
];
