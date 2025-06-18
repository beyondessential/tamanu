import { z } from 'zod';
import { faker } from '@faker-js/faker';
import { generateMock } from '@anatine/zod-mock';
import { createEncounterSchema } from '@tamanu/facility-server/schemas/encounter.schema';

const overrideForeignKeys = (schemaShape: z.ZodRawShape, mock: Record<string, any>) => {
  for (const key in schemaShape) {
    const schema = schemaShape[key];
    if (typeof schema.description === 'string' && schema.description.includes('__foreignKey__')) {
      mock[key] = undefined;
    }
  }
  return mock;
};

/**
 * Generates fake encounter request body data using the encounter schema
 * @param required - Required fields that must be provided
 * @param overrides - Optional overrides for the generated data
 * @returns Fake encounter request body data
 */
export const fakeCreateEncounterRequestBody = (
  required: {
    patientId: string;
    examinerId: string;
    locationId: string;
    departmentId: string;
  },
  overrides?: Partial<z.infer<typeof createEncounterSchema>>,
) => {
  const schemaShape = createEncounterSchema.shape;
  const mock = generateMock(createEncounterSchema, {
    stringMap: {
      startDate: () => faker.date.recent().toISOString(),
      reasonForEncounter: () => faker.lorem.sentence(),
    },
  });

  const final = {
    ...overrideForeignKeys(schemaShape, mock),
    ...overrides,
    ...required,
  };
  return final;
};
