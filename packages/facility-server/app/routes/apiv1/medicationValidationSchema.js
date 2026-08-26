import { z } from 'zod';

import {
  ADMINISTRATION_FREQUENCIES,
  DRUG_ROUTES,
  MAX_REPEATS,
  MEDICATION_DURATION_UNITS,
  PHARMACY_PRESCRIPTION_TYPES,
} from '@tamanu/constants';
import { dateCustomValidation, datetimeCustomValidation } from '@tamanu/utils/dateTime';

/**
 * Nothing entered, in every spelling the forms can produce: a field the form never filled in arrives
 * as null or not at all, and clearing a number input leaves an empty string behind. All of them mean
 * none, which is recorded as zero. Normalising here rather than at each call site keeps the
 * prescription and discharge routes reading a blank quantity identically, and keeps an empty string
 * away from Sequelize, whose integer validation rejects it.
 */
const blankAsZero = value => (value === '' || value === null || value === undefined ? 0 : value);

/** A dispensing quantity. Blank counts as zero; a quantity of at least one is only demanded of a
 * medication actually being sent to pharmacy, which each route checks for itself. */
export const DISPENSING_QUANTITY_SCHEMA = z.preprocess(
  blankAsZero,
  z.coerce.number().int().min(0),
);

export const REPEATS_SCHEMA = z.preprocess(
  blankAsZero,
  z.coerce.number().int().min(0).max(MAX_REPEATS),
);

/**
 * The medications table of a discharge, keyed by prescription id. Every listed prescription records
 * a dispensing quantity and repeats against itself, whether or not it is being sent to pharmacy.
 */
export const DISCHARGE_MEDICATIONS_SCHEMA = z.record(
  z.string(),
  z
    .object({
      quantity: DISPENSING_QUANTITY_SCHEMA,
      repeats: REPEATS_SCHEMA,
      sendToPharmacy: z.boolean().optional(),
    })
    .strip(),
);

const MEDICATION_INPUT_FIELDS = {
  encounterId: z.string().optional().nullable(),
  patientId: z.string().optional().nullable(),
  date: dateCustomValidation,
  notes: z.string().optional().nullable(),
  indication: z.string().optional().nullable(),
  route: z.enum(Object.values(DRUG_ROUTES)),
  medicationId: z.string(),
  prescriberId: z.string(),
  quantity: DISPENSING_QUANTITY_SCHEMA,
  isOngoing: z.boolean().optional().nullable(),
  isPrn: z.boolean().optional().nullable(),
  isVariableDose: z.boolean().optional().nullable(),
  doseAmount: z.coerce.number().positive().optional().nullable(),
  frequency: z.enum(Object.values(ADMINISTRATION_FREQUENCIES)),
  startDate: datetimeCustomValidation,
  durationValue: z.coerce.number().positive().optional().nullable(),
  durationUnit: z.enum(Object.values(MEDICATION_DURATION_UNITS)).optional().nullable(),
  isPhoneOrder: z.boolean().optional(),
  idealTimes: z.array(z.string()).optional().nullable(),
  repeats: REPEATS_SCHEMA,
};

const refineMedicationInput = (val, ctx) => {
  if (!val.isVariableDose && !val.doseAmount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Dose amount is required or isVariableDose must be true',
    });
  }
  if (val.durationValue && !val.durationUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Duration unit is required when duration value is provided',
    });
  }
  if (val.durationUnit && !val.durationValue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Duration value is required when duration unit is provided',
    });
  }
  if (
    val.frequency !== ADMINISTRATION_FREQUENCIES.IMMEDIATELY &&
    val.frequency !== ADMINISTRATION_FREQUENCIES.AS_DIRECTED &&
    !val.idealTimes?.length
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Ideal times are required when frequency is not IMMEDIATELY or AS_DIRECTED',
    });
  }
  if (
    (val.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY || val.isOngoing) &&
    val.durationValue
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Duration value and unit are not allowed when frequency is IMMEDIATELY or isOngoing',
    });
  }
};

/** A prescription written against a patient's ongoing medications, or as part of a medication set. */
export const MEDICATION_INPUT_SCHEMA = z
  .object(MEDICATION_INPUT_FIELDS)
  .strip()
  .superRefine(refineMedicationInput);

/**
 * A prescription written against an encounter, which can also be sent straight to pharmacy — a
 * pharmacy order belongs to an encounter, and ongoing medications go through
 * `send-ongoing-to-pharmacy` instead.
 */
export const ENCOUNTER_MEDICATION_INPUT_SCHEMA = z
  .object({
    ...MEDICATION_INPUT_FIELDS,
    sendToPharmacy: z.boolean().optional(),
    prescriptionType: z.enum(Object.values(PHARMACY_PRESCRIPTION_TYPES)).optional(),
  })
  .strip()
  .superRefine((val, ctx) => {
    refineMedicationInput(val, ctx);
    if (!val.sendToPharmacy) return;

    if (!val.prescriptionType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Prescription type is required when sending to pharmacy',
      });
    }
    if (!val.quantity || val.quantity < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Dispensing quantity of at least 1 is required when sending to pharmacy',
      });
    }
  });
