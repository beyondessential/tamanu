import { z } from 'zod';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { foreignKey } from '@tamanu/shared/schemas/types';

export const createEncounterSchema = z.object({
  // Required fields for encounter creation
  encounterType: z.enum([
    ENCOUNTER_TYPES.ADMISSION,
    ENCOUNTER_TYPES.CLINIC,
    ENCOUNTER_TYPES.IMAGING,
    ENCOUNTER_TYPES.EMERGENCY,
    ENCOUNTER_TYPES.OBSERVATION,
    ENCOUNTER_TYPES.TRIAGE,
    ENCOUNTER_TYPES.SURVEY_RESPONSE,
    ENCOUNTER_TYPES.VACCINATION,
  ]),
  startDate: z.coerce.date(), // ISO datetime string
  patientId: foreignKey,
  examinerId: foreignKey,
  locationId: foreignKey,
  departmentId: foreignKey,

  // Optional fields
  endDate: z.coerce.date().optional(), // ISO datetime string
  reasonForEncounter: z.string().optional(),
  deviceId: z.string().optional(),
  plannedLocationStartTime: z.coerce.date(), // ISO datetime string
  plannedLocationId: foreignKey.optional(),
  patientBillingTypeId: foreignKey.optional(),
  referralSourceId: foreignKey.optional(),
  dietIds: foreignKey.array().optional(), // JSON string of diet IDs
});

// Schema for updating encounters (all fields optional)
export const updateEncounterSchema = createEncounterSchema.partial().omit({
  encounterType: true, // Not needed for updates
});
