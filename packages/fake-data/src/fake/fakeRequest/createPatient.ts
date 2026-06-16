import { type z } from 'zod';

import { DEFAULT_PATIENT_DISPLAY_ID_PATTERN } from '@tamanu/constants';
import { createPatientSchema } from '@tamanu/shared/schemas/facility/requests/createPatient.schema';
import { generateIdFromPattern } from '@tamanu/utils/generateId';
import { keysFor, type WithRequired } from '../utils/types.ts';
import { createFakeSchemaFactory } from '../utils/schemaFaker.ts';

type Schema = z.infer<typeof createPatientSchema>;

const requiredKeys = keysFor<Schema>()('facilityId', 'registeredById');

// invoiceInsurancePlanId is a foreignKey[]; zocker supplies undefined for each foreignKey, which
// becomes null in JSON and causes invalid inserts into patient_invoice_insurance_plans.
// displayId is required at the DB layer; zocker often omits or falsifies optional strings.
const excludedFields = keysFor<Schema>()('patientFields', 'invoiceInsurancePlanId', 'displayId');

const buildPatientBodyWithoutDisplayId = createFakeSchemaFactory(
  createPatientSchema,
  requiredKeys,
  excludedFields,
);

type RequiredKeys = (typeof requiredKeys)[number];

export type FakeCreatePatientRequestOverrides = WithRequired<Schema, RequiredKeys> & {
  /** Facility `patientDisplayIdPattern` (A = random letter, 0 = random digit, literal in []). */
  patientDisplayIdPattern?: string;
};

/**
 * Fake patient create payload. Always includes a displayId (generated unless overridden) because
 * Patient.displayId is NOT NULL in the database. Generated IDs use the facility display-id pattern
 * language (same as the web app), defaulting to four letters + six digits.
 */
export const fakeCreatePatientRequestBody = (overrides: FakeCreatePatientRequestOverrides): Schema => {
  const { patientDisplayIdPattern, displayId, ...schemaOverrides } = overrides;
  const body = buildPatientBodyWithoutDisplayId(schemaOverrides);
  const resolvedDisplayId =
    typeof displayId === 'string' && displayId.length > 0
      ? displayId
      : generateIdFromPattern(patientDisplayIdPattern ?? DEFAULT_PATIENT_DISPLAY_ID_PATTERN);
  return { ...body, displayId: resolvedDisplayId };
};
