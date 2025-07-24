import { z } from 'zod';

import { ReferenceDataSchema } from './referenceData.schema';
import { ScheduledVaccineSchema } from './scheduledVaccine.schema';
import { UserSchema } from './user.schema';
import { LocationSchema } from './location.schema';
import { VACCINE_STATUS, INJECTION_SITE_VALUES } from '@tamanu/constants';

// Schema for administered vaccines returned to patient portal
export const AdministeredVaccineSchema = z.object({
  id: z.string(),
  // Vaccine administration details
  batch: z.string().nullish(),
  status: z.enum(VACCINE_STATUS),
  date: z.string().nullish(),
  location: LocationSchema.nullish(),
  // Injection details
  injectionSite: z.enum(INJECTION_SITE_VALUES).nullish(),
  // Vaccine information
  vaccineBrand: z.string().nullish(),
  vaccineName: z.string().nullish(),
  disease: z.string().nullish(),
  // Administration details
  givenBy: z.string().nullish(),
  givenElsewhere: z.boolean().nullish(),
  // Consent information
  consent: z.boolean().nullish(),
  consentGivenBy: z.string().nullish(),
  // Reason for not giving (if applicable)
  reason: z.string().nullish(),
  // Related data
  scheduledVaccine: ScheduledVaccineSchema.nullish(),
  recorder: UserSchema.nullish(),
  notGivenReason: ReferenceDataSchema.nullish(),
});

export type AdministeredVaccine = z.infer<typeof AdministeredVaccineSchema>;
