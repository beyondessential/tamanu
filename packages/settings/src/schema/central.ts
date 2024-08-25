import { extractDefaults } from './utils';
import { questionCodeIdsSchema } from './definitions';

export const centralSettings = {
  values: {
    questionCodeIds: {
      deprecated: true,
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
