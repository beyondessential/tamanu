import { faker } from '@faker-js/faker';
import { generateMock } from '@anatine/zod-mock';
import { createEncounterSchema } from '@tamanu/facility-server/schemas/encounter.schema';
import { processMock } from './utils';
import { CreateSchemaOptions } from './types';

type CreateEncounterOptions = CreateSchemaOptions<typeof createEncounterSchema>;

/**
 * Generates fake encounter request body data using the encounter schema
 * @param options - The options for creating the encounter
 * @returns Fake encounter request body data
 */
export const fakeCreateEncounterRequestBody = (options: CreateEncounterOptions) => {
  const { required, excludedFields = [], overrides = {} } = options;

  const mock = generateMock(createEncounterSchema, {
    stringMap: {
      startDate: () => faker.date.recent().toISOString().split('T')[0],
      reasonForEncounter: () => faker.lorem.sentence(),
      // 50% chance of having an end date
      endDate: () =>
        faker.helpers.maybe(() => faker.date.recent().toISOString().split('T')[0], {
          probability: 0.5,
        }),
    },
  });

  const final = {
    ...processMock({ schema: createEncounterSchema, mock, excludedFields }),
    ...overrides,
    ...required,
  };
  return final;
};
