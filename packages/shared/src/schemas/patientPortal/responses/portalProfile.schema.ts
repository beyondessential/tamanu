import { z } from 'zod';
import { PatientSchema } from './patient.schema';

export const PortalProfileSchema = PatientSchema.pick({
  displayId: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  sex: true,
}).extend({
  portalUserId: z.string(),
});

export const PortalProfilesSchema = z.object({
  email: z.string(),
  data: z.array(PortalProfileSchema),
});

export type PortalProfile = z.infer<typeof PortalProfileSchema>;
export type PortalProfiles = z.infer<typeof PortalProfilesSchema>;
