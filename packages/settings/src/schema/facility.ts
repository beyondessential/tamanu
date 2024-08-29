import * as yup from 'yup';
import { extractDefaults } from './utils';
import { questionCodeIdsDescription, questionCodeIdsSchema } from './definitions';

export const facilitySettings = {
  properties: {
    questionCodeIds: {
      deprecated: true,
      description: questionCodeIdsDescription,
      type: questionCodeIdsSchema,
      defaultValue: {
        passport: 'pde-FijCOVRDT005',
        nationalityId: 'pde-PalauCOVSamp7',
      },
    },
    templates: {
      properties: {
        letterhead: {
          name: 'Letterhead',
          description: '_',
          type: yup.object(),
          defaultValue: {},
        },
      },
    },
    vaccinations: {
      name: 'Vaccinations',
      description: '_',
      type: yup.object(),
      defaultValue: {},
    },
  },
};

export const facilityDefaults = extractDefaults(facilitySettings);
