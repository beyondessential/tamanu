import * as yup from 'yup';
import { extractDefaults } from './utils';

export const facilitySettings = {
properties: {
    vaccinations: {
      name: 'Vaccinations',
      description: '_',
      schema: yup.object(),
      defaultValue: {},
    },
  },
};

export const facilityDefaults = extractDefaults(facilitySettings);
