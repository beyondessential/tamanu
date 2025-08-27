import { z } from 'zod';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { foreignKey, stringWithMaxLength } from '@tamanu/shared/schemas/types';
import { datetimeCustomValidation } from '@tamanu/utils/dateTime';

export const createEncounterSchema = z.object({
  // Required fields for encounter creation
  encounterType: z.enum(ENCOUNTER_TYPES),
  startDate: datetimeCustomValidation,
  patientId: foreignKey,
  examinerId: foreignKey,
  locationId: foreignKey,
  departmentId: foreignKey,

  // Optional fields
  endDate: datetimeCustomValidation.optional(),
  reasonForEncounter: stringWithMaxLength.optional(),
  deviceId: stringWithMaxLength.optional(),
  plannedLocationStartTime: datetimeCustomValidation.optional(),
  plannedLocationId: foreignKey.optional(),
  patientBillingTypeId: foreignKey.optional(),
  referralSourceId: foreignKey.optional(),
  dietIds: foreignKey.array().optional(),
});

export const updateEncounterSchema = createEncounterSchema.partial().omit({
  encounterType: true,
});
