import * as yup from 'yup';
import { extractDefaults } from './utils';

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
  },
};

export const facilityDefaults = extractDefaults(facilitySettings);
