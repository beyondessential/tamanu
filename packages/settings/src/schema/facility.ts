import * as yup from 'yup';
import { extractDefaults } from './utils';

export const facilitySettings = {
  templates: {
    letterhead: {
      name: 'Letterhead',
      description: '_',
      schema: yup.object().required(),
      defaultValue: {},
    },
  },
  vaccinations: {
    name: 'Vaccinations',
    description: '_',
    schema: yup.object().required(),
    defaultValue: {},
  },
  survey: {
    defaultCodes: {
      name: 'Default codes',
      description:
        'Default reference data codes to use when creating a survey encounter (includes vitals) when none are explicitly specified',
      schema: yup.object().shape({
        department: yup.string().required(),
        location: yup.string().required(),
      }),
      defaultValue: {
        department: 'GeneralClinic',
        location: 'GeneralClinic',
      },
    },
  },
};

export const facilityDefaults = extractDefaults(facilitySettings);
