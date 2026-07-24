import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useFormikContext } from 'formik';

import { getAutocalculatedDispensingQuantity } from '@tamanu/shared/utils/medication';

/**
 * Keeps the dispensing `quantity` field in sync with the dose, frequency and duration while a
 * prescription is being written or edited. Renders nothing.
 *
 * The autocalculated value can always be edited manually; once the user changes the field it is
 * left alone. Selecting a different medication resets the autocalculation.
 *
 * `isOngoing` overrides the form's own `isOngoing` value, for forms where the ongoing flag is not
 * an editable field (e.g. the dispense "modify prescription" modal).
 */
export const DispensingQuantityAutocalculator = ({ enabled, isOngoing }) => {
  const { values, setFieldValue } = useFormikContext();
  const {
    medicationId,
    doseAmount,
    unitConversion,
    frequency,
    durationValue,
    durationUnit,
    isVariableDose,
    quantity,
  } = values;
  const ongoing = isOngoing ?? values.isOngoing;

  // The value we last auto-populated, used to detect when the user manually edits the field.
  const lastAutoValueRef = useRef(null);
  const isManualRef = useRef(false);
  const hasHandledMountRef = useRef(false);

  // Selecting a different medication resets the autocalculation (including any manual override).
  useEffect(() => {
    if (!hasHandledMountRef.current) return;
    isManualRef.current = false;
    lastAutoValueRef.current = null;
  }, [medicationId]);

  useEffect(() => {
    if (!enabled) return;

    const currentValue =
      quantity === '' || quantity === null || quantity === undefined ? null : Number(quantity);

    // On mount, adopt any pre-existing quantity as the baseline without overwriting it, so that
    // editing an existing prescription only recalculates once the user changes an input.
    if (!hasHandledMountRef.current) {
      hasHandledMountRef.current = true;
      lastAutoValueRef.current = currentValue;
      return;
    }

    // The field diverging from the last auto-populated value means the user edited it manually.
    if (
      !isManualRef.current &&
      lastAutoValueRef.current !== null &&
      currentValue !== lastAutoValueRef.current
    ) {
      isManualRef.current = true;
    }
    if (isManualRef.current) return;

    const nextQuantity = getAutocalculatedDispensingQuantity({
      doseAmount,
      unitConversion,
      frequency,
      durationValue,
      durationUnit,
      isOngoing: ongoing,
      isVariableDose,
    });

    if (nextQuantity === lastAutoValueRef.current) return;
    setFieldValue('quantity', nextQuantity ?? '');
    lastAutoValueRef.current = nextQuantity;
  }, [
    enabled,
    ongoing,
    doseAmount,
    unitConversion,
    frequency,
    durationValue,
    durationUnit,
    isVariableDose,
    quantity,
    setFieldValue,
  ]);

  return null;
};

DispensingQuantityAutocalculator.propTypes = {
  enabled: PropTypes.bool,
  isOngoing: PropTypes.bool,
};

DispensingQuantityAutocalculator.defaultProps = {
  enabled: false,
  isOngoing: undefined,
};
