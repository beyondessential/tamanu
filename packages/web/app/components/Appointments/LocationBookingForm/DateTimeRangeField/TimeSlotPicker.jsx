import ToggleButtonGroup, { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';
import FormHelperText, { formHelperTextClasses } from '@mui/material/FormHelperText';
import {
  addMilliseconds,
  areIntervalsOverlapping,
  endOfDay,
  isSameDay,
  isValid,
  max,
  min,
  startOfDay,
  startOfToday,
} from 'date-fns';
import { useFormikContext } from 'formik';
import { isEqual } from 'lodash';
import ms from 'ms';
import { PropTypes } from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

import { maxValidDate, minValidDate, toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useLocationBookingsQuery } from '../../../../api/queries';
import { Colors } from '../../../../constants';
import { useSettings } from '../../../../contexts/Settings';
import { OuterLabelFieldWrapper } from '../../../Field';
import { SkeletonTimeSlotToggles, TimeSlotToggle } from './TimeSlotToggle';
import { CONFLICT_TOOLTIP_TITLE, TIME_SLOT_PICKER_VARIANTS } from './constants';
import {
  appointmentToInterval,
  calculateTimeSlots,
  isSameArrayMinusHead,
  isSameArrayMinusHeadOrTail,
  isSameArrayMinusTail,
  isTimeSlotWithinRange,
} from './utils';

const ToggleGroup = styled(ToggleButtonGroup)`
  background-color: white;
  border: max(0.0625rem, 1px) solid ${({ error }) => (error ? Colors.alert : Colors.outline)};
  padding-block: 0.75rem;
  padding-inline: 0.85rem;

  &.${toggleButtonGroupClasses.root} {
    display: grid;
    gap: 0.5rem 0.75rem;
    grid-template-columns: repeat(2, 1fr);
  }

  // Workaround: MUI doesn’t seem to reliably include toggleButtonGroupClasses.disabled class when
  // disabled={true}, hence accessing directly
  ${({ disabled }) =>
    disabled &&
    css`
      background-color: initial;
    `}
`;

const StyledFormHelperText = styled(FormHelperText)`
  &.${formHelperTextClasses.root} {
    font-size: 0.75rem;
    font-weight: 500;
  }
`;

const idOfTimeSlot = timeSlot => timeSlot.start.valueOf();

/**
 * TimeSlotPicker assumes that it is given a valid `date`, and checks for conflicting
 * appointments/bookings only within this date. For overnight bookings, TimeSlotPicker assumes that
 * it will be appropriately disabled via the `disabled` prop if there is a booking conflict between
 * the start and end dates.
 */

export const TimeSlotPicker = ({
  date,
  disabled = false,
  /**
   * If true, this instance is probably a picker for the end time slot of an overnight booking
   * where the start time has been modified to a time such that there is a conflicting booking
   * between the start time and this `date`. Any state this instance had is now invalid, and
   * hasNoLegalSelection={true} indicates that this component should render with fresh state.
   */
  hasNoLegalSelection = false,
  label,
  required,
  variant = TIME_SLOT_PICKER_VARIANTS.RANGE,
  name,
  ...props
}) => {
  const {
    initialValues: { startTime: initialStart, endTime: initialEnd },
    setFieldValue,
    values,
    errors,
    isSubmitting,
  } = useFormikContext();

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (isSubmitting) setHasAttemptedSubmit(true);
  }, [isSubmitting]);

  const initialTimeRange = useMemo(() => {
    return isValid(initialStart) && isValid(initialEnd)
      ? { start: initialStart, end: initialEnd }
      : null;
  }, [initialStart, initialEnd]);

  const { getSetting } = useSettings();
  const bookingSlotSettings = getSetting('appointments.bookingSlots');
  const slotDurationMs = ms(bookingSlotSettings.slotDuration);

  // Fall back to arbitrary day so time slots render. Prevents GUI from looking broken when no date
  // is selected, but component should be disabled in this scenario
  const timeSlots = calculateTimeSlots(bookingSlotSettings, date ?? startOfToday());

  /**
   * Array of integers representing the selected toggle buttons. Each time slot is represented by
   * the integer form of its start time.
   */
  const [selectedToggles, setSelectedToggles] = useState(() => {
    if (!initialTimeRange) return [];

    // When modifying a non-overnight booking, don’t prepopulate the overnight variants of this
    // component (and vice versa)
    const isModifyingOvernightBooking = !isSameDay(initialStart, initialEnd);
    const isOvernightVariant = variant !== TIME_SLOT_PICKER_VARIANTS.RANGE;
    if (isModifyingOvernightBooking !== isOvernightVariant) return [];

    return timeSlots
      .filter(s => areIntervalsOverlapping(s, initialTimeRange))
      .map(({ start }) => start.valueOf());
  });
  const [hoverRange, setHoverRange] = useState(null);

  const dateIsValid = isValid(date);
  const dayStart = dateIsValid ? startOfDay(date) : null;
  const dayEnd = dateIsValid ? endOfDay(date) : null;

  const {
    data: existingBookings,
    isFetching: isFetchingExistingBookings,
  } = useLocationBookingsQuery(
    {
      after: toDateTimeString(dayStart),
      before: toDateTimeString(dayEnd),
      all: true,
      locationId: values.locationId,
    },
    { enabled: dateIsValid && !!values.locationId },
  );

  const updateSelection = useCallback(
    (newToggleSelection, { start: newStartTime, end: newEndTime }) => {
      setSelectedToggles(newToggleSelection);
      switch (variant) {
        case TIME_SLOT_PICKER_VARIANTS.RANGE:
          void setFieldValue('startTime', newStartTime);
          void setFieldValue('endTime', newEndTime);
          return;
        case TIME_SLOT_PICKER_VARIANTS.START:
          void setFieldValue('startTime', newStartTime);
          return;
        case TIME_SLOT_PICKER_VARIANTS.END:
          void setFieldValue('endTime', newEndTime);
          return;
      }
    },
    [setFieldValue, variant],
  );

  useEffect(() => {
    if (hasNoLegalSelection) updateSelection([], { end: null });
  }, [hasNoLegalSelection, updateSelection]);

  const endOfSlotStartingAt = slotStartTime => addMilliseconds(slotStartTime, slotDurationMs);

  /**
   * @param {Array<int>} newTogglesUnsorted Provided by MUI Toggle Button Group. This function
   * coerces this into a contiguous selection. Note that this array has set semantics, and is not
   * guaranteed to have its elements in natural order.
   */
  const handleChange = (_event, newTogglesUnsorted) => {
    const newToggles = newTogglesUnsorted.toSorted();

    switch (variant) {
      case TIME_SLOT_PICKER_VARIANTS.RANGE: {
        // Deselecting the only selected time slot
        if (newToggles.length === 0) {
          updateSelection([], { start: null, end: null });
          return;
        }

        // Fresh selection
        if (newToggles.length === 1) {
          const newStart = new Date(newToggles[0]);
          const newEnd = endOfSlotStartingAt(newStart);
          updateSelection(newToggles, { start: newStart, end: newEnd });
          return;
        }

        // One time slot already selected. A second one makes a contiguous series.
        // (Selecting tail before head is allowed.)
        if (selectedToggles.length === 1) {
          const newStart = new Date(newToggles[0]);
          const startOfLatestSlot = new Date(newToggles.at(-1));
          const newEnd = endOfSlotStartingAt(startOfLatestSlot);
          const newTimeRange = { start: newStart, end: newEnd };
          const newSelection = timeSlots
            .filter(slot => areIntervalsOverlapping(slot, newTimeRange))
            .map(idOfTimeSlot);
          updateSelection(newSelection, newTimeRange);
          return;
        }

        // Many time slots already selected. User may shorten the selection by deselecting only the
        // first or last slot.
        if (isSameArrayMinusHeadOrTail(newToggles, selectedToggles)) {
          const newStart = new Date(newToggles[0]);
          const newEnd = endOfSlotStartingAt(new Date(newToggles.at(-1)));
          updateSelection(newToggles, { start: newStart, end: newEnd });
          return;
        }

        // Many time slots selected. Toggling anything other than the head or tail would create a
        // discontinuous selection, so clear the selection instead.
        updateSelection([], { start: null, end: null });
        setHoverRange(null);
        return;
      }
      case TIME_SLOT_PICKER_VARIANTS.START: {
        // Deselecting the only selected time slot (necessarily the latest time slot of the day)
        if (newToggles.length === 0) {
          updateSelection([], { start: null });
          return;
        }

        // Many time slots already selected. User may shorten the selection by deselecting only the
        // earliest slot.
        if (isSameArrayMinusHead(newToggles, selectedToggles)) {
          const newStart = new Date(newToggles[0]);
          updateSelection(newToggles, { start: newStart });
          return;
        }

        // Fresh selection. Select this and all succeeding time slots
        if (newToggles.length === 1 && !isSameArrayMinusTail(newToggles, selectedToggles)) {
          //                           ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Carves out
          //                           the scenario where only the latest two slots were selected,
          //                           and user tries to toggle off the latest slot, which would
          //                           leave only the second-latest slot selected (illegally)
          const [selectedToggle] = newToggles;
          const newSelection = timeSlots.map(idOfTimeSlot).filter(slot => slot >= selectedToggle);

          const newStart = new Date(selectedToggle);
          updateSelection(newSelection, { start: newStart });
          return;
        }

        // Many time slots selected. Toggling anything other than the head would create a
        // discontinuous selection, so clear the selection instead.
        updateSelection([], { start: null });
        return;
      }
      case TIME_SLOT_PICKER_VARIANTS.END: {
        // Deselecting the only selected time slot (necessarily the earliest time slot of the day)
        if (newToggles.length === 0) {
          updateSelection([], { end: null });
          return;
        }

        // Many time slots already selected. User may shorten the selection by deselecting only the
        // latest slot.
        if (isSameArrayMinusTail(newToggles, selectedToggles)) {
          const startOfLastSlot = new Date(newToggles.at(-1));
          const newEnd = endOfSlotStartingAt(startOfLastSlot);
          updateSelection(newToggles, { end: newEnd });
          return;
        }

        // Fresh selection. Select this and all preceding time slots
        if (newToggles.length === 1 && !isSameArrayMinusHead(newToggles, selectedToggles)) {
          //                           ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Carves out
          //                           the scenario where only the earliest two slots were selected,
          //                           and user tries to toggle off the earliest slot, which would
          //                           leave only the second-earliest slot selected (illegally)
          const [selectedToggle] = newToggles;
          const newSelection = timeSlots.map(idOfTimeSlot).filter(slot => slot <= selectedToggle);

          const startOfTimeSlot = new Date(selectedToggle);
          const newEnd = endOfSlotStartingAt(startOfTimeSlot);
          updateSelection(newSelection, { end: newEnd });
          return;
        }

        // Many time slots selected. Toggling anything other than the tail would create a
        // discontinuous selection, so clear the selection instead.
        updateSelection([], { end: null });
        return;
      }
    }
  };

  const bookedIntervals = useMemo(
    () =>
      existingBookings?.data
        .map(appointmentToInterval)
        .filter(interval => !isEqual(interval, initialTimeRange)) ?? [], // Ignore the booking currently being modified
    [existingBookings?.data, initialTimeRange],
  );

  /** A time slot is selectable if it does not create a selection of time slots that collides with another booking */
  const checkIfSelectableTimeSlot = useCallback(
    timeSlot => {
      let targetSelection; // The would-be time range if this time slot were to be selected
      switch (variant) {
        case TIME_SLOT_PICKER_VARIANTS.RANGE:
          // If beginning a fresh selection, discontinuity is impossible
          if (!values.startTime || !values.endTime) return true;
          targetSelection = {
            start: minValidDate([values.startTime, timeSlot.start]),
            end: maxValidDate([values.endTime, timeSlot.end]),
          };
          break;

        case TIME_SLOT_PICKER_VARIANTS.START:
          targetSelection = {
            start: timeSlot.start,
            end: dayEnd,
          };
          break;

        case TIME_SLOT_PICKER_VARIANTS.END:
          targetSelection = {
            start: dayStart,
            end: timeSlot.end,
          };
          break;
      }

      return !bookedIntervals.some(interval => areIntervalsOverlapping(targetSelection, interval));
    },
    [bookedIntervals, dayEnd, dayStart, values.endTime, values.startTime, variant],
  );

  const errorKey = variant === TIME_SLOT_PICKER_VARIANTS.RANGE ? 'endTime' : name;
  const error = errors[errorKey];
  const showError = hasAttemptedSubmit && error;

  return (
    <OuterLabelFieldWrapper label={label} required={required}>
      <ToggleGroup
        disabled={disabled}
        value={selectedToggles}
        onChange={handleChange}
        error={showError}
        {...props}
      >
        {isFetchingExistingBookings ? (
          <SkeletonTimeSlotToggles />
        ) : (
          timeSlots.map(timeSlot => {
            const isBooked = bookedIntervals.some(bookedInterval =>
              areIntervalsOverlapping(timeSlot, bookedInterval),
            );
            const id = idOfTimeSlot(timeSlot);

            const onMouseEnter = () => {
              if (selectedToggles.length > 1) return;

              switch (variant) {
                case TIME_SLOT_PICKER_VARIANTS.RANGE:
                  if (!values.startTime || !values.endTime) {
                    setHoverRange(timeSlot);
                    return;
                  }

                  setHoverRange({
                    start: min([timeSlot.start, values.startTime]),
                    end: max([timeSlot.end, values.endTime]),
                  });
                  return;
                case TIME_SLOT_PICKER_VARIANTS.START:
                  setHoverRange({
                    start: timeSlot.start,
                    end: endOfDay(date),
                  });
                  return;
                case TIME_SLOT_PICKER_VARIANTS.END:
                  setHoverRange({
                    start: startOfDay(date),
                    end: timeSlot.end,
                  });
                  return;
              }
            };

            return (
              <TimeSlotToggle
                booked={isBooked}
                conflictTooltipTitle={CONFLICT_TOOLTIP_TITLE[variant]}
                disabled={disabled}
                inHoverRange={isTimeSlotWithinRange(timeSlot, hoverRange)}
                key={id}
                onMouseEnter={onMouseEnter}
                onMouseLeave={() => setHoverRange(null)}
                selectable={!hasNoLegalSelection && checkIfSelectableTimeSlot(timeSlot)}
                timeSlot={timeSlot}
                value={id}
              />
            );
          })
        )}
      </ToggleGroup>
      {showError && <StyledFormHelperText error>{error}</StyledFormHelperText>}
    </OuterLabelFieldWrapper>
  );
};

TimeSlotPicker.propTypes = {
  date: PropTypes.instanceOf(Date),
  disabled: PropTypes.bool,
  hasNoLegalSelection: PropTypes.bool,
  label: PropTypes.elementType,
  required: PropTypes.bool,
  variant: PropTypes.oneOf(Object.values(TIME_SLOT_PICKER_VARIANTS)),
};

TimeSlotPicker.defaultProps = {
  date: startOfToday(),
  disabled: false,
  hasNoLegalSelection: false,
  label: undefined,
  required: false,
  variant: TIME_SLOT_PICKER_VARIANTS.RANGE,
};
