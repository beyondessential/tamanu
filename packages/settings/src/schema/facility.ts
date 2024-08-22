import * as yup from 'yup';
import { extractDefaults } from './utils';

export const facilitySettings = {
  vaccinations: {
    name: 'Vaccinations',
    description: '_',
    schema: yup.object(),
    defaultValue: {},
  },
};

export const facilityDefaults = extractDefaults(facilitySettings);
