import React from 'react';
import { Box } from '@material-ui/core';

import { DRUG_ROUTE_LABELS, MEDICATION_DURATION_UNITS_LABELS } from '@tamanu/constants';
import { TranslatedSelectField, TranslatedText } from '@tamanu/ui-components';

import { preventInvalidNumber, validateDecimalPlaces } from '../../utils/utils';
import { AutocompleteField, CheckField, Field, NumberField } from '../Field';
import { BodyText } from '../Typography';
import { FrequencySearchField } from './FrequencySearchInput';

/**
 * Shared field shells for the clinical prescription fields, composed by both prescribing
 * (MedicationForm) and pharmacy's modify-at-dispense (ModifyPrescriptionModal). Each shell fixes
 * the stable parts — field name, label string id, input component, static input props — while
 * everything form-specific (onChange side effects, required/disabled conditions, unit adornments,
 * component overrides, testids) is passed through as props, which spread last and win.
 */

export const MedicationAutocompleteField = props => (
  <Field
    name="medicationId"
    label={<TranslatedText stringId="medication.medication.label" fallback="Medication" />}
    component={AutocompleteField}
    required
    {...props}
  />
);

export const VariableDoseCheckField = props => (
  <Field
    name="isVariableDose"
    label={
      <BodyText>
        <TranslatedText stringId="medication.variableDose.label" fallback="Variable dose" />
      </BodyText>
    }
    component={CheckField}
    {...props}
  />
);

export const DoseAmountField = props => (
  <Field
    name="doseAmount"
    label={<TranslatedText stringId="medication.doseAmount.label" fallback="Dose amount" />}
    component={NumberField}
    min={0}
    onInput={validateDecimalPlaces}
    {...props}
  />
);

export const FrequencyField = props => (
  <Field name="frequency" component={FrequencySearchField} required {...props} />
);

export const RouteField = props => (
  <Field
    name="route"
    label={
      <TranslatedText
        stringId="medication.routeOfAdministration.label"
        fallback="Route of administration"
      />
    }
    component={TranslatedSelectField}
    enumValues={DRUG_ROUTE_LABELS}
    required
    {...props}
  />
);

export const DurationValueField = props => (
  <Field
    name="durationValue"
    label={<TranslatedText stringId="medication.duration.label" fallback="Duration" />}
    component={NumberField}
    min={0}
    onInput={preventInvalidNumber}
    {...props}
  />
);

// The blank-looking label keeps the unit select aligned beside the duration value input.
export const DurationUnitField = props => (
  <Field
    name="durationUnit"
    label={<Box sx={{ opacity: 0 }}>.</Box>}
    component={TranslatedSelectField}
    enumValues={MEDICATION_DURATION_UNITS_LABELS}
    {...props}
  />
);
