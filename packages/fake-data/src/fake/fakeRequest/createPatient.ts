import { z } from 'zod';
import { faker } from '@faker-js/faker';
import { generateMock } from '@anatine/zod-mock';
import { createPatientSchema } from '@tamanu/facility-server/schemas/patient.schema';
import { generateId } from '@tamanu/utils/generateId';

const overrideForeignKeys = (schemaShape: z.ZodRawShape, mock: Record<string, any>) => {
  for (const key in schemaShape) {
    const schema = schemaShape[key];
    if (typeof schema.description === 'string' && schema.description.includes('__foreignKey__')) {
      mock[key] = undefined;
    }
  }
  return mock;
};

export const fakeCreatePatientRequestBody = (
  overrides?: Partial<z.infer<typeof createPatientSchema>>,
) => {
  const schemaShape = createPatientSchema.shape;

  const mock = generateMock(createPatientSchema, {
    stringMap: {
      dateOfBirth: () => faker.date.birthdate().toISOString().split('T')[0], // YYYY-MM-DD format
      timeOfBirth: () => faker.date.recent().toISOString(), // Full ISO datetime string
      NHN: () => generateId(),
      displayId: () => generateId(),
    },
  });

  mock.patientFields = {};

  const final = { ...overrideForeignKeys(schemaShape, mock), ...overrides };

  return final;
};
