import { z } from 'zod';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { foreignKey } from '@tamanu/shared/schemas/types';
import { datetimeCustomValidation } from '@tamanu/utils/dateTime';

export const createEncounterSchema = z.object({
  // Required fields for encounter creation
  encounterType: z.enum(Object.values(ENCOUNTER_TYPES)),
  startDate: datetimeCustomValidation,
  patientId: foreignKey,
  examinerId: foreignKey,
  locationId: foreignKey,
  departmentId: foreignKey,

  // Optional fields
  endDate: datetimeCustomValidation.optional(),
  reasonForEncounter: z.string().optional(),
  deviceId: z.string().optional(),
  plannedLocationStartTime: datetimeCustomValidation,
  plannedLocationId: foreignKey.optional(),
  patientBillingTypeId: foreignKey.optional(),
  referralSourceId: foreignKey.optional(),
  dietIds: foreignKey.array().optional(),
});

export const updateEncounterSchema = createEncounterSchema.partial().omit({
  encounterType: true,
});
