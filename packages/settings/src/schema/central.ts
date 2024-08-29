import { extractDefaults } from './utils';
import { questionCodeIdsDescription, questionCodeIdsSchema } from './definitions';

export const centralSettings = {
  properties: {
    questionCodeIds: {
      deprecated: true,
      description: questionCodeIdsDescription,
      type: questionCodeIdsSchema,
      defaultValue: {
        passport: null,
        nationalityId: null,
        email: null,
      },
    },
  },
};

export const centralDefaults = extractDefaults(centralSettings);
