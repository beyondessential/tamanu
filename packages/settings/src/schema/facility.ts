import * as yup from 'yup';
import { extractDefaults } from './utils';
import { questionCodeIdsDescription, questionCodeIdsSchema } from './definitions';

export const facilitySettings = {
  values: {
    questionCodeIds: {
      deprecated: true,
      description: questionCodeIdsDescription,
      schema: questionCodeIdsSchema,
      defaultValue: {
        passport: 'pde-FijCOVRDT005',
        nationalityId: 'pde-PalauCOVSamp7',
      },
    },
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
