import { z } from 'zod';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { LocationSchema } from './location.schema';

export const EncounterSchema = z.object({
  id: z.string(),
  encounterType: z.enum(Object.values(ENCOUNTER_TYPES) as [string, ...string[]]),
  startDate: z.string(),
  endDate: z.string().nullable(),
  reasonForEncounter: z.string().nullable(),
  deviceId: z.string().nullable(),
  plannedLocationStartTime: z.string().nullable(),
  dischargeDraft: z.string().nullable(),
  updatedAtSyncTick: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  patientId: z.string(),
  examinerId: z.string(),
  locationId: z.string(),
  plannedLocationId: z.string().nullable(),
  departmentId: z.string(),
  patientBillingTypeId: z.string(),
  referralSourceId: z.string(),
  location: LocationSchema.nullable(),
});

export type Encounter = z.infer<typeof EncounterSchema>;
