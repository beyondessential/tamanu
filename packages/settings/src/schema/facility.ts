import * as yup from 'yup';
import { extractDefaults } from './utils';
import {
  emailSchema,
  nationalityIdSchema,
  passportSchema,
  questionCodeIdsDescription,
} from './definitions';

export const facilitySettings = {
  name: 'Facility server settings',
  description: 'Settings that apply only to a facility server',
  properties: {
    questionCodeIds: {
      deprecated: true,
      description: questionCodeIdsDescription,
      properties: {
        passport: {
          type: passportSchema,
          defaultValue: 'pde-FijCOVRDT005',
        },
        nationalityId: {
          type: nationalityIdSchema,
          defaultValue: 'pde-PalauCOVSamp7',
        },
        email: {
          type: emailSchema,
          defaultValue: null,
        },
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
