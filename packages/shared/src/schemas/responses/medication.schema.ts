import { z } from 'zod';
import { ReferenceDataSchema } from './referenceData.schema';

const PrescriberSchema = z
  .object({
    id: z.string(),
    displayName: z.string().nullable(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
  })
  .nullable();

export const MedicationSchema = z.object({
  id: z.string(),
  doseAmount: z.number().nullable(),
  units: z.string(),
  frequency: z.string(),
  route: z.string(),
  date: z.string(), // prescription date
  startDate: z.string().nullable(),
  indication: z.string().nullable(),
  isPrn: z.boolean().nullable(),
  discontinued: z.boolean().nullable(),
  medication: ReferenceDataSchema,
  prescriber: PrescriberSchema,
});

export const MedicationsArraySchema = z.array(MedicationSchema);

export type Medication = z.infer<typeof MedicationSchema>;
