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
};

export const facilityDefaults = extractDefaults(facilitySettings);
