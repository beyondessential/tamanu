import { zocker } from 'zocker';

import { createPatientSchema } from '@tamanu/shared/schemas/facility/requests/createPatient.schema';
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

  const mock = zocker(createPatientSchema)
    .supply(createPatientSchema.shape.displayId, generateId())
    .generate();

  const final = {
    ...processMock({
      schema: createPatientSchema,
      mock,
      excludedFields,
    }),
    ...overrides,
    ...required,
  };

  return final;
};
