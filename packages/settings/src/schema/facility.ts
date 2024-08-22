import * as yup from 'yup';
import { extractDefaults } from './utils';

export const facilitySettings = {
  values: {
    templates: {
      values: {
        letterhead: {
          name: 'Letterhead',
          description: '_',
          schema: yup.object(),
          defaultValue: {},
        },
      },
    },
    vaccinations: {
      name: 'Vaccinations',
      description: '_',
      schema: yup.object(),
      defaultValue: {},
    },
  },
};

export const facilityDefaults = extractDefaults(facilitySettings);
