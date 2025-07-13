import { z } from 'zod';
import { VACCINE_STATUS, INJECTION_SITE_VALUES } from '@tamanu/constants';
import { ScheduledVaccineSchema } from './scheduledVaccine.schema';
import { EncounterSchema } from './encounter.schema';
import { UserSchema } from './user.schema';
import { LocationSchema } from './location.schema';
import { DepartmentSchema } from './department.schema';
import { ReferenceDataSchema } from './referenceData.schema';

export const AdministeredVaccineSchema = z.object({
  id: z.string(),
  batch: z.string().nullable(),
  consent: z.boolean().nullable(),
  consentGivenBy: z.string().nullable(),
  status: z.enum(Object.values(VACCINE_STATUS) as [string, ...string[]]),
  reason: z.string().nullable(),
  injectionSite: z.enum(Object.values(INJECTION_SITE_VALUES) as [string, ...string[]]).nullable(),
  givenBy: z.string().nullable(),
  givenElsewhere: z.boolean().nullable(),
  vaccineBrand: z.string().nullable(),
  vaccineName: z.string().nullable(),
  disease: z.string().nullable(),
  circumstanceIds: z.array(z.string()).nullable(),
  date: z.string(),
  updatedAtSyncTick: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  encounterId: z.string(),
  scheduledVaccineId: z.string(),
  recorderId: z.string(),
  locationId: z.string(),
  departmentId: z.string(),
  notGivenReasonId: z.string().nullable(),
  // Custom computed fields added by the endpoint
  vaccineDisplayName: z.string().nullable(),
  displayLocation: z.string().nullable(),
  // Associated entities
  encounter: EncounterSchema,
  location: LocationSchema.nullable(),
  department: DepartmentSchema.nullable(),
  recorder: UserSchema.nullable(),
  notGivenReason: ReferenceDataSchema.nullable(),
  scheduledVaccine: ScheduledVaccineSchema,
  // Flag indicating if vaccine is certifiable
  certifiable: z.boolean().nullable(),
});

export const AdministeredVaccinesArraySchema = z.array(AdministeredVaccineSchema);
export type AdministeredVaccine = z.infer<typeof AdministeredVaccineSchema>;
