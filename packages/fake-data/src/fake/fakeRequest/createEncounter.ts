import { z } from 'zod';
import { faker } from '@faker-js/faker';
import { generateMock } from '@anatine/zod-mock';
import { createEncounterSchema } from '@tamanu/facility-server/schemas/encounter.schema';
import { processMock } from './utils';

type CreateEncounterOptions = {
  required: {
    patientId: string;
    examinerId: string;
    locationId: string;
    departmentId: string;
  };
  excludedFields?: (keyof z.infer<typeof createEncounterSchema>)[];
  overrides?: Partial<z.infer<typeof createEncounterSchema>>;
};

/**
 * Generates fake encounter request body data using the encounter schema
 * @param options - The options for creating the encounter
 * @returns Fake encounter request body data
 */
export const fakeCreateEncounterRequestBody = (options: CreateEncounterOptions) => {
  const { required, excludedFields = [], overrides = {} } = options;

  const mock = generateMock(createEncounterSchema, {
    stringMap: {
      startDate: () => faker.date.recent().toISOString(),
      reasonForEncounter: () => faker.lorem.sentence(),
    },
  });

  const final = {
    ...processMock(createEncounterSchema, mock, excludedFields),
    ...overrides,
    ...required,
  };
  return final;
};
