import React from 'react';
import * as yup from 'yup';

import { DRUG_ROUTE_VALUES } from '@tamanu/constants';
import { TranslatedText } from '@tamanu/ui-components';

import { foreignKey } from '../../utils/validation';

const requiredMessage = (
  <TranslatedText stringId="validation.required.inline" fallback="*Required" />
);

/**
 * Validation for the clinical prescription fields, shared between prescribing
 * (MedicationForm) and pharmacy's modify-at-dispense (ModifyPrescriptionModal) so the
 * invariants — dose required unless variable, duration value/unit paired, valid route —
 * cannot drift between the two. An exact extraction of MedicationForm's rules; consumers
 * needing looser variants (e.g. nullable numerics in the modify modal) derive them locally.
 */
export const prescriptionClinicalValidation = {
  medicationId: foreignKey(requiredMessage),
  doseAmount: yup
    .number()
    .positive()
    .translatedLabel(
      <TranslatedText stringId="medication.doseAmount.label" fallback="Dose amount" />,
    )
    .when('isVariableDose', {
      is: true,
      then: schema => schema.optional(),
      otherwise: schema => schema.required(requiredMessage),
    }),
  frequency: foreignKey(requiredMessage),
  route: foreignKey(requiredMessage).oneOf(DRUG_ROUTE_VALUES),
  durationValue: yup
    .number()
    .positive()
    .translatedLabel(<TranslatedText stringId="medication.duration.label" fallback="Duration" />),
  durationUnit: yup
    .string()
    .when('durationValue', (durationValue, schema) =>
      durationValue ? schema.required(requiredMessage) : schema.optional(),
    ),
};
