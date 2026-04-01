import { z } from 'zod';

import { createPatientSchema } from '@tamanu/shared/schemas/facility/requests/createPatient.schema';
import { keysFor } from '../utils/types.js';
import { createFakeSchemaFactory } from '../utils/schemaFaker.js';

type Schema = z.infer<typeof createPatientSchema>;

const requiredKeys = keysFor<Schema>()('facilityId', 'registeredById');

const excludedFields = keysFor<Schema>()('patientFields');

export const fakeCreatePatientRequestBody = createFakeSchemaFactory(
  createPatientSchema,
  requiredKeys,
  excludedFields,
);
