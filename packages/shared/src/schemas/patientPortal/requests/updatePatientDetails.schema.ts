import { z } from 'zod';
import { TITLES } from '@tamanu/constants';

/** Digits, spaces, hyphens and brackets, with an optional leading plus sign. */
export const PHONE_NUMBER_PATTERN = /^\+?[\d\s\-()]+$/;

/** A blank answer clears the detail. */
const blankToNull = (value: string | null) => (value === '' ? null : value);

const text = z.string().trim().max(255).nullable().transform(blankToNull);
const phoneNumber = text.refine(value => value === null || PHONE_NUMBER_PATTERN.test(value), {
  message: 'Enter a phone number using digits, spaces, +, - or brackets',
});
const referenceDataId = z.string().trim().max(255).nullable().transform(blankToNull);

/**
 * The details a patient can change on their own record from the portal. Only the details the
 * patient changed are sent; anything else is left as it is.
 */
export const UpdatePatientDetailsRequestSchema = z
  .object({
    title: z
      .enum(Object.values(TITLES) as [string, ...string[]])
      .nullable()
      .or(z.literal('').transform(() => null)),
    email: z
      .string()
      .trim()
      .max(255)
      .transform(blankToNull)
      .refine(value => value === null || z.email().safeParse(value).success, {
        message: 'Enter a valid email address',
      })
      .nullable(),
    primaryContactNumber: phoneNumber,
    secondaryContactNumber: phoneNumber,
    streetVillage: text,
    cityTown: text,
    emergencyContactName: text,
    emergencyContactNumber: phoneNumber,
    insurerPolicyNumber: text,
    ethnicityId: referenceDataId,
    insurerId: referenceDataId,
    occupationId: referenceDataId,
  })
  .partial()
  .strict();

export type UpdatePatientDetailsRequest = z.infer<typeof UpdatePatientDetailsRequestSchema>;

/** The patient's own record holds email; every other editable detail is additional data. */
export const PATIENT_EDITABLE_PATIENT_FIELDS = ['email'] as const;
