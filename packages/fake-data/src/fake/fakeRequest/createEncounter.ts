import { zocker } from 'zocker';
import { processMock } from './utils';
import { CreateSchemaOptions } from './types';
import { createEncounterSchema } from '@tamanu/shared/schemas/facility/requests/createEncounter.schema';

type CreateEncounterOptions = CreateSchemaOptions<typeof createEncounterSchema>;

/**
 * Generates fake encounter request body data using the encounter schema
 * @param options - The options for creating the encounter
 * @returns Fake encounter request body data
 */
export const fakeCreateEncounterRequestBody = (options: CreateEncounterOptions) => {
  const { required, excludedFields = [], overrides = {} } = options;

  const mock = zocker(createEncounterSchema).generate();

  const final = {
    ...processMock({
      schema: createEncounterSchema,
      mock,
      excludedFields,
    }),
    ...overrides,
    ...required,
  };
  return final;
};
