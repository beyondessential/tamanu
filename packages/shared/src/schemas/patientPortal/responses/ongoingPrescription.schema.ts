import { z } from 'zod';
import { UserSchema } from './user.schema';
import { ReferenceDataSchema } from './referenceData.schema';

export const OngoingPrescriptionSchema = z.object({
  id: z.string(),
  medication: ReferenceDataSchema,
  // Dose fields
  doseAmount: z.coerce.number().optional(),
  units: z.string().optional(),
  // Frequency and duration
  frequency: z.string().optional(),
  durationValue: z.coerce.number().optional(),
  durationUnit: z.string().optional(),
  // Route and dates
  route: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // Prescriber information
  prescriber: UserSchema.optional(),
  // Status flags
  isOngoing: z.boolean().optional(),
  isPrn: z.boolean().optional(),
  isVariableDose: z.boolean().optional(),
  discontinued: z.boolean().optional(),
  discontinuedDate: z.string().optional(),
  discontinuingReason: z.string().optional(),
  // Additional information
  notes: z.string().optional(),
  indication: z.string().optional(),
  repeats: z.number().optional(),
  quantity: z.number().optional(),
});

export type OngoingPrescription = z.infer<typeof OngoingPrescriptionSchema>;
