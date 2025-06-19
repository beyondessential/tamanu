import { z } from 'zod';
import { generateMock } from '@anatine/zod-mock';
import { createPatientSchema } from '@tamanu/facility-server/schemas/patient.schema';
import { generateId } from '@tamanu/utils/generateId';
import { processMock } from './utils';

type CreatePatientOptions = {
  required: {
    registeredById: string;
    facilityId: string;
  };
  excludedFields?: (keyof z.infer<typeof createPatientSchema>)[];
  overrides?: Partial<z.infer<typeof createPatientSchema>>;
};

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
      NHN: () => generateId(),
      displayId: () => generateId(),
    },
  });

  const final = {
    ...processMock(createPatientSchema, mock, excludedFields),
    ...overrides,
    ...required,
  };

  return final;
};
