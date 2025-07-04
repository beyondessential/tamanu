import { z } from 'zod';
import { ReferenceDataSchema } from './ReferenceDataSchema';

const ClinicianSchema = z
  .object({
    id: z.string(),
    displayName: z.string().nullable(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
  })
  .nullable();

const LocationSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    locationGroup: z
      .object({
        id: z.string(),
        name: z.string(),
        facility: z
          .object({
            id: z.string(),
            name: z.string(),
          })
          .nullable(),
      })
      .nullable(),
  })
  .nullable();

const LocationGroupSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    facility: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .nullable(),
  })
  .nullable();

export const AppointmentSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string().nullable().optional(),
  status: z.string(),
  isHighPriority: z.boolean(),
  clinician: ClinicianSchema.optional(),
  location: LocationSchema.optional(),
  locationGroup: LocationGroupSchema.optional(),
  appointmentType: ReferenceDataSchema.nullable().optional(),
  bookingType: ReferenceDataSchema.nullable().optional(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;
