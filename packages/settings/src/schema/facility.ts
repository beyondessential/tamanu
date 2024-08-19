import * as yup from 'yup';
import { extractDefaults } from './utils';

export const facilitySettings = {
  templates: {
    letterhead: {
      name: 'Letterhead',
      description: '_',
      schema: yup.object().required(),
      default: {},
    },
  },
  vaccinations: {
    name: 'Vaccinations',
    description: '_',
    schema: yup.object().required(),
    default: {},
  },
  survey: {
    defaultCodes: {
      name: 'Default codes',
      description: '_',
      schema: yup.object().shape({
        department: yup.string().required(),
        location: yup.string().required(),
      }),
      default: {
        department: 'GeneralClinic',
        location: 'GeneralClinic',
      },
    },
  },
};

export const facilityDefaults = extractDefaults(facilitySettings);
