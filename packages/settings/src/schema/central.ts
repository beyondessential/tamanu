import { extractDefaults } from './utils';
import { questionCodeIdsDescription, questionCodeIdsSchema } from './definitions';

export const centralSettings = {
  values: {
    questionCodeIds: {
      deprecated: true,
      description: questionCodeIdsDescription,
      schema: questionCodeIdsSchema,
      defaultValue: {
        passport: null,
        nationalityId: null,
        email: null,
      },
    },
  },
};

export const centralDefaults = extractDefaults(centralSettings);
