import React, { memo, useState } from 'react';
import styled from 'styled-components';
import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import {
  DRUG_ROUTE_LABELS,
  DRUG_STOCK_STATUS_LABELS,
  DRUG_STOCK_STATUSES,
  DRUG_UNIT_LABELS,
  DRUG_UNIT_PLURAL_LABELS,
  DRUG_UNIT_VERBS,
  MEDICATION_DURATION_DISPLAY_UNITS_LABELS,
} from '@tamanu/constants';
import {
  getDateFromTimeString,
  getMedicationDoseDisplay,
  getTranslatedFrequency,
} from '@tamanu/shared/utils/medication';
import {
  getPatientNameAsString,
  TableCellTag,
  TAMANU_COLORS,
  TextInput,
  ThemedTooltip,
  TranslatedText,
} from '@tamanu/ui-components';
import { AutocompleteInput } from '../components/Field';
import { TranslatedEnum } from '../components';
import { useSuggester } from '../api';
import { STOCK_STATUS_COLORS } from '../constants';
import { singularize } from './utils';

// `name` is carried through so the change handler can populate Label text from it.
export const presetLabelFormatter = ({ id, code, name }) => ({ value: id, label: code, name });
export const PRESET_LABEL_SUGGESTER_OPTIONS = { formatter: presetLabelFormatter };

const StyledInstructionsTextInput = styled(TextInput)`
  .MuiInputBase-root.Mui-disabled {
    background: ${TAMANU_COLORS.background};
  }
  .MuiInputBase-multiline {
    padding-block: 0;
  }
  .MuiInputBase-input {
    font-size: 14px;
    padding-block: 10px;
  }
`;

// Disabled MUI v4 multiline TextField doesn't autosize reliably — it sticks at
// minRows height and clips longer content. The read-only path renders a styled
// div instead, sized to its content, so wrapped lines stay visible.
const ReadOnlyInstructions = styled.div`
  background: ${TAMANU_COLORS.background};
  border: 1px solid ${TAMANU_COLORS.outline};
  border-radius: 4px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 18px;
  color: ${TAMANU_COLORS.darkestText};
  white-space: pre-wrap;
  word-wrap: break-word;
  box-sizing: border-box;
`;

export const InstructionsInput = memo(({ value, onChange, disabled, testId, ...props }) => {
  if (disabled) {
    return (
      <ReadOnlyInstructions data-testid={testId} {...props}>
        {value ?? ''}
      </ReadOnlyInstructions>
    );
  }
  return (
    <StyledInstructionsTextInput
      multiline
      minRows={1}
      maxRows={5}
      testId={testId}
      {...props}
      value={value ?? ''}
      onChange={onChange}
    />
  );
});

const StyledQuantityTextInput = styled(TextInput)`
  .MuiInputBase-input {
    font-size: 14px;
    padding-block: 10px;
    padding-inline: 8px;
  }
`;

export const QuantityInput = memo(({ value: defaultValue, onChange, ...props }) => {
  const [value, setValue] = useState(defaultValue);
  const handleChange = e => {
    setValue(e.target.value);
    onChange(e);
  };
  return (
    <StyledQuantityTextInput {...props} type="number" value={value} onChange={handleChange} />
  );
});

export const StyledPresetLabelAutocomplete = styled(AutocompleteInput)`
  .MuiInputBase-input {
    font-size: 14px;
    padding-block: 10px;
  }
`;

// Single source of truth for fetching + gating preset-label visibility. Both
// dispense modals consume this — same cache key, same staleTime.
export const usePresetLabelsQuery = ({ enabled, facilityId }) => {
  const presetLabelSuggester = useSuggester(
    'medicationPresetLabel',
    PRESET_LABEL_SUGGESTER_OPTIONS,
  );
  const { data: presetLabelsList } = useQuery({
    queryKey: ['medicationPresetLabels', facilityId],
    queryFn: () => presetLabelSuggester.fetchSuggestions(''),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
  return {
    presetLabelSuggester,
    presetLabelsList,
    hasPresetLabels: (presetLabelsList?.length ?? 0) > 0,
  };
};

// Picking a preset replaces Label text with its translated name; clearing reverts
// to the prescription-derived default. Pure — both modals' handlers reduce to one
// call.
export const resolvePresetLabelText = (presetId, presetLabelsList, fallbackText) => {
  if (!presetId) return fallbackText ?? '';
  const preset = presetLabelsList?.find(p => p.value === presetId);
  return preset?.name ?? fallbackText ?? '';
};

// Only drop the leading capital from ordinary capitalised words (e.g. 'Tablet' ->
// 'tablet', 'Oral' -> 'oral', 'Two times daily' -> 'two times daily'). Acronym and
// symbol units/routes such as 'IU', 'FFU', 'IM', 'S/C' and 'mL' keep their casing.
const lowercaseFirstLetter = text =>
  /^[A-Z][a-z]/.test(text ?? '')
    ? `${text.charAt(0).toLowerCase()}${text.slice(1)}`
    : text;

// Shared sentence assembly for the Instructions and Label text defaults. The two
// differ only in how the dose/frequency/route tokens are derived and whether a
// verb is prefixed; the segment ordering, separators and punctuation live here so
// they stay in sync. Built as derived values rather than a mutated accumulator.
const assembleMedicationLine = (
  { dose, frequency, route, duration, indication, notes, verb },
  getTranslation,
) => {
  const forText = getTranslation('medication.dispense.for', 'for');
  const head = [dose, frequency].filter(Boolean).join(' ').trim();
  const withRoute = route ? `${head}${head ? ',' : ''} ${route}` : head;
  const withDuration = duration
    ? `${withRoute}${withRoute ? ` ${forText} ` : ''}${duration}`
    : withRoute;
  const withIndication = indication
    ? `${withDuration}${withDuration ? ', ' : ''}${indication}`
    : withDuration;
  const punctuated =
    withIndication && !withIndication.endsWith('.') ? `${withIndication}.` : withIndication;
  const withVerb = verb && punctuated ? `${verb} ${punctuated}` : punctuated;
  const withNotes = notes ? `${withVerb}${withVerb ? ' ' : ''}${String(notes).trim()}` : withVerb;
  return withNotes.trim();
};

const buildDuration = (durationValue, durationUnit, getEnumTranslation) => {
  if (!durationValue || !durationUnit) return null;
  const unitLabel = getEnumTranslation(MEDICATION_DURATION_DISPLAY_UNITS_LABELS, durationUnit);
  return `${durationValue} ${singularize(unitLabel, durationValue).toLowerCase()}`;
};

export const buildInstructionText = (prescription, getTranslation, getEnumTranslation) => {
  if (!prescription) return '';

  const {
    frequency: prescriptionFrequency,
    route: prescriptionRoute,
    durationValue,
    durationUnit,
    indication,
    notes,
  } = prescription;

  const dose = getMedicationDoseDisplay(
    prescription,
    getTranslation,
    getEnumTranslation,
  ).toLowerCase();
  const frequency = prescriptionFrequency
    ? getTranslatedFrequency(prescriptionFrequency, getTranslation)
    : null;
  const route = prescriptionRoute ? getEnumTranslation(DRUG_ROUTE_LABELS, prescriptionRoute) : null;

  return assembleMedicationLine(
    {
      dose,
      frequency,
      route,
      duration: buildDuration(durationValue, durationUnit, getEnumTranslation),
      indication,
      notes,
    },
    getTranslation,
  );
};

// Builds the default dispensed-medication "Label text". Same sentence structure as
// buildInstructionText, but with the patient-facing formatting from TAM-6813:
//  - units use the long form ('tablet', not 'tab'), pluralised when dose > 1
//  - the leading capital of unit, frequency and route is dropped (words only)
//  - an administration verb (e.g. 'Take') is prefixed based on the dosing unit
// These changes apply to the label text only, never the Instructions field.
export const buildLabelText = (prescription, getTranslation, getEnumTranslation) => {
  if (!prescription) return '';

  const {
    units,
    doseAmount,
    isVariableDose,
    frequency: prescriptionFrequency,
    route: prescriptionRoute,
    durationValue,
    durationUnit,
    indication,
    notes,
  } = prescription;

  const numericDose = Number(doseAmount);
  const isPlural = !isVariableDose && Number.isFinite(numericDose) && numericDose > 1;
  const unitEnum = isPlural ? DRUG_UNIT_PLURAL_LABELS : DRUG_UNIT_LABELS;
  const unitText = units ? lowercaseFirstLetter(getEnumTranslation(unitEnum, units)) : '';
  const amountText = isVariableDose
    ? lowercaseFirstLetter(getTranslation('medication.table.variable', 'Variable'))
    : doseAmount ?? '';
  const dose = `${amountText} ${unitText}`.trim();

  const frequency = prescriptionFrequency
    ? lowercaseFirstLetter(getTranslatedFrequency(prescriptionFrequency, getTranslation))
    : null;
  const route = prescriptionRoute
    ? lowercaseFirstLetter(getEnumTranslation(DRUG_ROUTE_LABELS, prescriptionRoute))
    : null;
  // Only prefix a verb when one is configured for the unit. getEnumTranslation
  // falls back to the raw value, so an unmapped unit would otherwise start the
  // sentence with the unit noun (e.g. 'Wafer 2 wafers...'); omitting it is safer
  // than assuming an (oral) default verb for a unit we don't recognise.
  const verb =
    units && DRUG_UNIT_VERBS[units] ? getEnumTranslation(DRUG_UNIT_VERBS, units) : null;

  return assembleMedicationLine(
    {
      dose,
      frequency,
      route,
      duration: buildDuration(durationValue, durationUnit, getEnumTranslation),
      indication,
      notes,
      verb,
    },
    getTranslation,
  );
};

/**
 * Transforms selected dispensable medication items into label data for printing.
 * @param {Object} params
 * @param {Array} params.items - The selected medication items to dispense (each includes medicationName, already translated by the caller if needed)
 * @param {Object} params.patient - The patient object
 * @param {Object} params.facility - The facility object
 * @returns {Array} Array of label data objects for printing
 */
export const getMedicationLabelData = ({ items, patient, facility, currentDateTime }) => {
  const facilityAddress = [facility?.streetAddress, facility?.cityTown].filter(Boolean).join(', ');

  return items.map(item => ({
    id: item.id,
    medicationName: item.medicationName || '-',
    instructions: item.instructions || '',
    patientName: patient ? getPatientNameAsString(patient) : '-',
    dispensedAt: item.dispensedAt || currentDateTime,
    quantity: item.quantity,
    units: item.units || '',
    remainingRepeats: item.remainingRepeats,
    prescriberName: item.prescriberName || '-',
    requestNumber: item.requestNumber || '-',
    facilityName: facility?.name || '',
    facilityAddress,
    facilityContactNumber: facility?.contactNumber || '',
  }));
};

/**
 * Returns the display name for a medication using reference-data translation when available.
 * Uses the medication's id and type for lookup, with name as fallback and '-' when missing.
 *
 * @param {Object} [medication] - Medication record (may have id, type, name)
 * @param {Function} getReferenceDataTranslation - Translation function from useTranslation()
 * @returns {string} Translated or fallback medication name, or '-' if none
 */
export const getTranslatedMedicationName = (medication, getReferenceDataTranslation) => {
  return getReferenceDataTranslation({
    value: medication?.id,
    category: medication?.type,
    fallback: medication?.name,
    placeholder: '-',
  });
};

export const isWithinTimeSlot = (timeSlot, time, isFuture = false) => {
  if (!time || !timeSlot || isFuture) return true; // Skip validation if no value or timeSlot or isFuture

  // Convert times to minutes since midnight for easier comparison
  const timeToMinutes = date => date.getHours() * 60 + date.getMinutes();

  // Get the minutes for the selected time
  const selectedTimeMinutes = timeToMinutes(new Date(time));

  const slotStartMinutes = timeToMinutes(getDateFromTimeString(timeSlot.startTime));
  const slotEndMinutes = timeToMinutes(getDateFromTimeString(timeSlot.endTime));

  // Check if the time slot crosses midnight
  if (slotEndMinutes < slotStartMinutes) {
    // For time slots that cross midnight
    return selectedTimeMinutes >= slotStartMinutes || selectedTimeMinutes <= slotEndMinutes;
  } else {
    // For normal time slots within the same day
    return selectedTimeMinutes >= slotStartMinutes && selectedTimeMinutes <= slotEndMinutes;
  }
};

const StyledTag = styled(TableCellTag)`
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 14px;
  line-height: 18px;
`;

export const createPrescriptionHash = prescription =>
  `${prescription.medicationId}-${prescription.doseAmount}-${prescription.units}-${prescription.route}-${prescription.frequency}`;

export const getStockStatus = ({ prescription }, useStyledTag = true) => {
  const status =
    prescription.medication?.referenceDrug?.facilities?.[0]?.stockStatus ||
    DRUG_STOCK_STATUSES.UNKNOWN;
  const quantity = prescription.medication?.referenceDrug?.facilities?.[0]?.quantity || 0;

  const color = STOCK_STATUS_COLORS[status];

  const content = useStyledTag ? (
    <StyledTag $color={color} noWrap>
      <TranslatedEnum value={status} enumValues={DRUG_STOCK_STATUS_LABELS} />
    </StyledTag>
  ) : (
    <TranslatedEnum value={status} enumValues={DRUG_STOCK_STATUS_LABELS} />
  );

  if (status === DRUG_STOCK_STATUSES.IN_STOCK) {
    return (
      <ThemedTooltip
        title={
          <Box maxWidth="75px">
            <TranslatedText
              stringId="medication.stockLevel.tooltip"
              fallback="Stock level: :quantity units"
              replacements={{ quantity }}
            />
          </Box>
        }
      >
        <span>{content}</span>
      </ThemedTooltip>
    );
  }
  return content;
};
