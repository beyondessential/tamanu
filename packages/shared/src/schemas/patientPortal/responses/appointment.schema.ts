import { z } from 'zod';

import { ReferenceDataSchema } from './referenceData.schema';
import { UserSchema } from './user.schema';
import { LocationGroupSchema } from './locationGroup.schema';
import { APPOINTMENT_STATUSES } from '@tamanu/constants';

// Schema for appointments returned to patient - only includes Outpatient Appointments as of 16/07/25
export const AppointmentSchema = z.object({
  id: z.string(),
  // Appointment timing
  startTime: z.string(),
  endTime: z.string().nullish(),
  // Appointment details
  status: z.enum(APPOINTMENT_STATUSES),
  isHighPriority: z.boolean(),
  // Type information
  appointmentType: ReferenceDataSchema.nullish(),
  // Location information
  locationGroup: LocationGroupSchema.nullish(),
  // Clinician information
  clinician: UserSchema.nullish(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;
