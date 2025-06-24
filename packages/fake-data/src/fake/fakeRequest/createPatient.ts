import { generateMock } from '@anatine/zod-mock';
import { createPatientSchema } from '@tamanu/facility-server/schemas/patient.schema';
import { generateId } from '@tamanu/utils/generateId';
import { CreateSchemaOptions } from './types';
import { processMock } from './utils';

type CreatePatientOptions = CreateSchemaOptions<typeof createPatientSchema>;

/**
 * @param options - The options for creating the patient
 * @returns The final patient object
 */
export const fakeCreatePatientRequestBody = (options: CreatePatientOptions) => {
  const {
    required,
    excludedFields = ['patientFields', 'dateOfBirth', 'timeOfBirth'],
    overrides = {},
  } = options;

  const mock = generateMock(createPatientSchema, {
    stringMap: {
      displayId: () => generateId(),
    },
  });

  const final = {
    ...processMock({ schema: createPatientSchema, mock, excludedFields }),
    ...overrides,
    ...required,
  };

  return final;
};
