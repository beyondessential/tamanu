import { z } from 'zod';
import { ScheduledVaccineSchema } from './ScheduledVaccineSchema';
import { EncounterSchema } from './EncounterSchema';
import { UserSchema } from './UserSchema';
import { LocationSchema } from './LocationSchema';
import { DepartmentSchema } from './DepartmentSchema';

export const AdministeredVaccineSchema = z.object({
  id: z.string(),
  status: z.string(),
  date: z.string(),
  batch: z.string().nullable(),
  injectionSite: z.string().nullable(),
  vaccineName: z.string().nullable(),
  vaccineBrand: z.string().nullable(),
  disease: z.string().nullable(),
  givenBy: z.string().nullable(),
  givenElsewhere: z.boolean().nullable(),
  notGivenReason: z.string().nullable(),
  certifiable: z.boolean().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  encounterId: z.string(),
  scheduledVaccineId: z.string(),
  scheduledVaccine: ScheduledVaccineSchema,
  encounter: EncounterSchema,
  recorder: UserSchema.nullable(),
  location: LocationSchema.nullable(),
  department: DepartmentSchema.nullable(),
});

export const AdministeredVaccinesArraySchema = z.array(AdministeredVaccineSchema);
export type AdministeredVaccine = z.infer<typeof AdministeredVaccineSchema>;
