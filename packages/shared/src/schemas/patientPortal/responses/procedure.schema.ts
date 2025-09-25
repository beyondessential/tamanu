import { z } from 'zod';
import { UserSchema } from './user.schema';
import { ReferenceDataSchema } from './referenceData.schema';

export const ProcedureSchema = z.object({
  id: z.string(),
  completed: z.boolean(),
  date: z.string(),
  endTime: z.string().nullish(),
  startTime: z.string().nullish(),
  note: z.string().nullish(),
  completedNote: z.string().nullish(),
  encounterId: z.string().nullish(),
  locationId: z.string().nullish(),
  procedureTypeId: z.string().nullish(),
  physicianId: z.string().nullish(),
  anaesthetistId: z.string().nullish(),
  anaestheticId: z.string().nullish(),
  departmentId: z.string().nullish(),
  assistantAnaesthetistId: z.string().nullish(),
  timeIn: z.string().nullish(),
  timeOut: z.string().nullish(),
  // Related entities
  procedureType: ReferenceDataSchema.nullish(),
  leadClinician: UserSchema.nullish(),
});

export type Procedure = z.infer<typeof ProcedureSchema>;
