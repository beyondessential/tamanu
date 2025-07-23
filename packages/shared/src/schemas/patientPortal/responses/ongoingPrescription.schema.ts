import { z } from 'zod';
import { UserSchema } from './user.schema';
import { ReferenceDataSchema } from './referenceData.schema';

export const OngoingPrescriptionSchema = z.object({
  id: z.string(),
  medication: ReferenceDataSchema,
  // Dose fields
  doseAmount: z.coerce.number().nullish(),
  units: z.string().nullish(),
  // Frequency and duration
  frequency: z.string().nullish(),
  durationValue: z.coerce.number().nullish(),
  durationUnit: z.string().nullish(),
  // Route and dates
  route: z.string().nullish(),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
  // Prescriber information
  prescriber: UserSchema.nullish(),
  // Status flags
  isOngoing: z.boolean().nullish(),
  isPrn: z.boolean().nullish(),
  isVariableDose: z.boolean().nullish(),
  discontinued: z.boolean().nullish(),
  discontinuedDate: z.string().nullish(),
  discontinuingReason: z.string().nullish(),
  // Additional information
  notes: z.string().nullish(),
  indication: z.string().nullish(),
  repeats: z.number().nullish(),
  quantity: z.number().nullish(),
});

export type OngoingPrescription = z.infer<typeof OngoingPrescriptionSchema>;
