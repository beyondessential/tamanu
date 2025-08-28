import { z } from 'zod';
import { createEncounterSchema } from '@tamanu/shared/schemas/facility/requests/createEncounter.schema';
import { createFakeSchemaFactory } from '../utils/schemaFaker';
import { keysFor } from '../utils/types';

type Schema = z.infer<typeof createEncounterSchema>;

const requiredKeys = keysFor<Schema>()('patientId', 'examinerId', 'locationId', 'departmentId');

const excludedFields = keysFor<Schema>()('dietIds');

export const fakeCreateEncounterRequestBody = createFakeSchemaFactory(
  createEncounterSchema,
  requiredKeys,
  excludedFields,
);
