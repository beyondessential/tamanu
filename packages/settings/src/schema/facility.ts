import * as yup from 'yup';
import { extractDefaults } from './utils';
import { letterheadProperties } from './definitions';

export const facilitySettings = {
  name: 'Facility server settings',
  description: 'Settings that apply only to a facility server',
  properties: {
    vaccinations: {
      name: 'Vaccinations',
      description: '_',
      type: yup.object(),
      defaultValue: {},
    },
    survey: {
      name: 'Survey settings',
      description: '_',
      properties: {
        defaultCodes: {
          name: 'Default codes',
          description:
            'Default reference data codes to use when creating a survey encounter (includes vitals) when none are explicitly specified',
          properties: {
            department: {
              name: 'Department',
              description: 'Default department code',
              type: yup.string(),
              defaultValue: 'GeneralClinic',
            },
            location: {
              name: 'Location',
              description: 'Default location code',
              type: yup.string(),
              defaultValue: 'GeneralClinic',
            },
          },
        },
      },
    },
    templates: {
      description: 'Strings to be inserted into emails/PDFs',
      properties: {
        letterhead: {
          description: 'The text at the top of most patient PDFs',
          properties: letterheadProperties,
        },
      },
    },
  },
};

export const facilityDefaults = extractDefaults(facilitySettings);
