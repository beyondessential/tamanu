import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { MEDICATION_DURATION_DISPLAY_UNITS_LABELS, DRUG_ROUTE_LABELS } from '@tamanu/constants';
import { singularize } from './index';

/**
 * Formats medication instructions from prescription data
 * Format: <Dose amount and Units><Frequency>, <Route> for <Duration>, for <Indication>. <Notes>.
 * Omits optional details that might not be recorded
 */
export const formatMedicationInstructions = (
  prescription,
  getTranslation,
  getEnumTranslation,
) => {
  const parts = [];

  // Dose amount and units
  const doseDisplay = getMedicationDoseDisplay(prescription, getTranslation, getEnumTranslation);
  if (doseDisplay) {
    parts.push(doseDisplay);
  }

  // Frequency
  const frequency = prescription.frequency
    ? getTranslatedFrequency(prescription.frequency, getTranslation)
    : null;
  if (frequency) {
    parts.push(frequency);
  }

  // Route
  const route = prescription.route
    ? getEnumTranslation(DRUG_ROUTE_LABELS, prescription.route) || prescription.route
    : null;

  // Duration
  let durationText = '';
  if (prescription.durationValue && prescription.durationUnit) {
    const unitLabel = getEnumTranslation(
      MEDICATION_DURATION_DISPLAY_UNITS_LABELS,
      prescription.durationUnit,
    );
    const singularizedUnit = singularize(unitLabel, prescription.durationValue).toLowerCase();
    durationText = `for ${prescription.durationValue} ${singularizedUnit}`;
  }

  // Build the main instruction string
  let instruction = '';
  if (doseDisplay && frequency) {
    instruction = `${doseDisplay} ${frequency}`;
  } else if (doseDisplay) {
    instruction = doseDisplay;
  } else if (frequency) {
    instruction = frequency;
  }

  if (route) {
    if (instruction) {
      instruction += `, ${route}`;
    } else {
      instruction = route;
    }
  }

  if (durationText) {
    if (instruction) {
      instruction += ` ${durationText}`;
    } else {
      instruction = durationText;
    }
  }

  // Indication
  if (prescription.indication) {
    if (instruction) {
      instruction += `, for ${prescription.indication}`;
    } else {
      instruction = `for ${prescription.indication}`;
    }
  }

  // Notes
  if (prescription.notes) {
    if (instruction) {
      instruction += `. ${prescription.notes}`;
    } else {
      instruction = prescription.notes;
    }
  } else if (instruction) {
    instruction += '.';
  }

  return instruction || '';
};
