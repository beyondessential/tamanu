import { extractDefaults } from './utils';
import {
  emailSchema,
  nationalityIdSchema,
  passportSchema,
  questionCodeIdsDescription,
} from './definitions';

export const centralSettings = {
  name: 'Central server settings',
  description: 'Settings that apply only to a central server',
  properties: {
    questionCodeIds: {
      deprecated: true,
      description: questionCodeIdsDescription,
      properties: {
        passport: {
          type: passportSchema,
          defaultValue: null,
        },
        nationalityId: {
          type: nationalityIdSchema,
          defaultValue: null,
        },
        email: {
          type: emailSchema,
          defaultValue: null,
        },
      },
    },
  },
};

export const centralDefaults = extractDefaults(centralSettings);
