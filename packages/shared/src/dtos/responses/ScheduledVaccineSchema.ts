import { z } from 'zod';
import { VACCINE_CATEGORIES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { ReferenceDataSchema } from './ReferenceDataSchema';

export const ScheduledVaccineSchema = z.object({
  id: z.string(),
  category: z.enum(Object.values(VACCINE_CATEGORIES) as [string, ...string[]]),
  label: z.string(),
  doseLabel: z.string(),
  weeksFromBirthDue: z.number().nullable(),
  weeksFromLastVaccinationDue: z.number().nullable(),
  index: z.number(),
  hideFromCertificate: z.boolean(),
  visibilityStatus: z.enum(Object.values(VISIBILITY_STATUSES) as [string, ...string[]]),
  sortIndex: z.number(),
  updatedAtSyncTick: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  vaccineId: z.string(),
  vaccine: ReferenceDataSchema.nullable(),
});

export type ScheduledVaccine = z.infer<typeof ScheduledVaccineSchema>;
