import {
  REPORT_STATUSES_VALUES,
  REPORT_DEFAULT_DATE_RANGES_VALUES,
  REPORT_DATA_SOURCE_VALUES,
} from 'shared/constants';
import { PARAMETER_FIELD_COMPONENTS } from '../../../reports/ParameterField';

export const schema = {
  title: 'Report',
  type: 'object',
  description: 'A report',
  properties: {
    query: {
      type: 'string',
      title: 'Query',
      description:
        'This is the actual raw sql query. Needs to include replacements for each of the specified parameters. You will need to ensure that parameters are optional and the query will run if they are not supplied',
    },
    notes: {
      type: 'string',
      title: 'Notes',
      description: 'Optional field for any notes that need to be left for reports administrators',
    },
    status: {
      type: 'string',
      title: 'Status',
      description: 'The status of the report, the newest published version is the one that is used',
      enum: REPORT_STATUSES_VALUES,
    },
    queryOptions: {
      type: 'object',
      title: 'Query Options',
      description: 'Options for the query',

      properties: {
        defaultDateRange: {
          type: 'string',
          title: 'Default Date Range',
          description: 'The default date range for the query',
          enum: REPORT_DEFAULT_DATE_RANGES_VALUES,
        },
        dataSources: {
          type: 'array',
          title: 'Data Sources',
          description: 'The data context the query is run for',
          items: {
            type: 'string',
            enum: REPORT_DATA_SOURCE_VALUES,
          },
        },
        parameters: {
          type: 'array',
          title: 'Parameters',
          description: 'Parameters for the query',
          items: {
            $ref: 'parameters',
          },
        },
      },
    },
  },
  required: ['query', 'queryOptions'],
};

export const schemaRefs = {
  parameters: {
    type: 'object',
    title: 'Property',
    description:
      'A property that informs dynamic filtering of query and fields displayed on query generation form',
    properties: {
      parameterField: {
        type: 'string',
        title: 'Parameter Field',
        description:
          'This is the form field that is displayed to the user in the Tamanu desktop app that is used to capture the user input',
        enum: Object.keys(PARAMETER_FIELD_COMPONENTS),
      },
      name: {
        type: 'string',
        title: 'Name',
        description:
          'Name of the parameter. This is the same name that maps to the replacement in the query sql',
      },
      label: {
        type: 'string',
        title: 'Label',
        description: 'This is the label for the form field in Tamanu desktop app',
      },
      suggesterEndpoint: {
        type: 'string',
        title: 'Suggester Endpoint',
        description:
          'This is the form field that is displayed to the user in the Tamanu desktop app that is used to capture the user input',
        enum: [
          'department',
          'division',
          'facilityLocationGroup',
          'icd10',
          'location',
          'locationGroup',
          'medicalArea',
          'nursingZone',
          'patientBillingType',
          'practitioner',
          'survey',
        ],
      },
      suggesterOptions: {
        type: 'object',
        title: 'Suggester Options',
        description: 'Options for the suggester',
      },
    },
    required: ['parameterField', 'name', 'label'],
  },
};

export const templates = [
  {
    text: 'Parameter',
    title: 'Insert a parameter node',
    field: 'ParameterTemplate',
    value: {
      parameterField: '',
      name: '',
      label: '',
      suggesterEndpoint: '',
    },
  },
];
