import FormHelperText, { formHelperTextClasses } from '@mui/material/FormHelperText';
import ToggleButtonGroup, { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';
import { areIntervalsOverlapping, max, min, parseISO } from 'date-fns';
import { useFormikContext } from 'formik';
import { isEqual } from 'lodash';
import { PropTypes } from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

import {
  endpointsOfDay,
  isIntervalWithinInterval,
  maxValidDate,
  minValidDate,
  toDateTimeString,
} from '@tamanu/shared/utils/dateTime';

import { useLocationBookingsQuery } from '../../../../api/queries';
import { Colors } from '../../../../constants';
import { useBookingTimeSlots } from '../../../../hooks/useBookingTimeSlots';
import { OuterLabelFieldWrapper } from '../../../Field';
import { PlaceholderTimeSlotToggles, TimeSlotToggle } from './TimeSlotToggle';
import { CONFLICT_TOOLTIP_TITLE, TIME_SLOT_PICKER_VARIANTS } from './constants';
import {
  appointmentToInterval,
  idOfTimeSlot,
  isSameArrayMinusHead,
  isSameArrayMinusHeadOrTail,
  isSameArrayMinusTail,
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

/**
 * TimeSlotPicker assumes that it is given a valid `date`, and checks for conflicting
 * appointments/bookings only within this date. For overnight bookings, TimeSlotPicker assumes that
 * it will be appropriately disabled via the `disabled` prop if there is a booking conflict between
 * the start and end dates.
 */
export const TimeSlotPicker = ({
  /** Valid ISO date string. */
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
  const [dayStart, dayEnd] = useMemo(() => {
    return date ? endpointsOfDay(parseISO(date)) : [null, null];
  }, [date]);

  const {
    initialValues: { startTime: initialStart, endTime: initialEnd },
    setFieldValue,
    values,
    errors,
    isSubmitting,
  } = useFormikContext();

  const {
    slots: timeSlots,
    isPending: isTimeSlotsPending,
    slotContaining,
    endOfSlotContaining,
  } = useBookingTimeSlots(dayStart);

  const initialInterval = useMemo(
    () => appointmentToInterval({ startTime: initialStart, endTime: initialEnd }),
    [initialStart, initialEnd],
  );

  /**
   * Array of integers representing the selected toggle buttons. Each time slot is represented by
   * the integer form of its start time.
   */
  const [selectedToggles, setSelectedToggles] = useState(
    initialInterval
      ? timeSlots?.filter(slot => areIntervalsOverlapping(slot, initialInterval)).map(idOfTimeSlot)
      : [],
  );
  const [hoverRange, setHoverRange] = useState(null);

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
    { enabled: !!date && !!values.locationId },
  );

  const updateInterval = useCallback(
    newInterval => {
      const { start, end } = newInterval;
      if (start !== undefined) void setFieldValue('startTime', toDateTimeString(start));
      if (end !== undefined) void setFieldValue('endTime', toDateTimeString(end));
    },
    [setFieldValue],
  );

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
          updateInterval({ start: null, end: null });
          return;
        }

        // Fresh selection
        if (newToggles.length === 1) {
          const start = new Date(newToggles[0]);
          const end = endOfSlotContaining(start);
          updateInterval({ start, end });
          return;
        }

        if (
          // One time slot already selected. A second one makes a contiguous series. (Selecting
          // tail before head is allowed.)
          selectedToggles.length === 1 ||
          // Many time slots already selected. User may shorten the selection by deselecting only
          // the head or tail slot.
          isSameArrayMinusHeadOrTail(newToggles, selectedToggles)
        ) {
          const start = new Date(newToggles[0]);
          const end = endOfSlotContaining(new Date(newToggles.at(-1)));
          updateInterval({ start, end });
          return;
        }

        // Many time slots selected. Toggling anything other than the head or tail would create a
        // discontinuous selection, so clear the selection instead.
        updateInterval({ start: null, end: null });
        setHoverRange(null);
        return;
      }
      case TIME_SLOT_PICKER_VARIANTS.START: {
        // Deselecting the only selected time slot (necessarily the latest time slot of the day)
        if (newToggles.length === 0) {
          updateInterval({ start: null });
          return;
        }

        if (
          // Many time slots already selected. User may shorten the selection by deselecting only the
          // earliest slot.
          isSameArrayMinusHead(newToggles, selectedToggles) ||
          // Fresh selection
          (newToggles.length === 1 && !isSameArrayMinusTail(newToggles, selectedToggles))
          //                          ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Carves out
          //                          the scenario where only the latest two slots were selected,
          //                          and user tries to toggle off the latest slot, which would
          //                          leave only the second-latest slot selected (illegally)
        ) {
          const start = new Date(newToggles[0]);
          updateInterval({ start });
          return;
        }

        // Many time slots selected. Toggling anything other than the head would create a
        // discontinuous selection, so clear the selection instead.
        updateInterval({ start: null });
        return;
      }
      case TIME_SLOT_PICKER_VARIANTS.END: {
        // Deselecting the only selected time slot (necessarily the earliest time slot of the day)
        if (newToggles.length === 0) {
          updateInterval({ end: null });
          return;
        }

        // Many time slots already selected. User may shorten the selection by deselecting only the
        // latest slot.
        if (isSameArrayMinusTail(newToggles, selectedToggles)) {
          const startOfLastSlot = new Date(newToggles.at(-1));
          updateInterval({ end: endOfSlotContaining(startOfLastSlot) });
          return;
        }

        // Fresh selection. Select this and all preceding time slots
        if (newToggles.length === 1 && !isSameArrayMinusHead(newToggles, selectedToggles)) {
          //                           ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Carves out
          //                           the scenario where only the earliest two slots were selected,
          //                           and user tries to toggle off the earliest slot, which would
          //                           leave only the second-earliest slot selected (illegally)
          const startOfTimeSlot = new Date(newToggles[0]);
          updateInterval({ end: endOfSlotContaining(startOfTimeSlot) });
          return;
        }

        // Many time slots selected. Toggling anything other than the tail would create a
        // discontinuous selection, so clear the selection instead.
        updateInterval({ end: null });
        return;
      }
    }
  };

  const bookedIntervals = useMemo(
    () =>
      existingBookings?.data
        .map(appointmentToInterval)
        .filter(interval => !isEqual(interval, initialInterval)) ?? [], // Ignore the booking currently being modified
    [existingBookings?.data, initialInterval],
  );

  /** A time slot is selectable if it does not create a selection of time slots that collides with another booking */
  const checkIfSelectableTimeSlot = useCallback(
    timeSlot => {
      if (variant === TIME_SLOT_PICKER_VARIANTS.RANGE && (!values.startTime || !values.endTime)) {
        // If beginning a fresh selection in the RANGE variant, discontinuity is impossible
        return true;
      }

      /** Returns the would-be time range selection if the provided time slot were to be clicked */
      const getTargetSelection = () => {
        switch (variant) {
          case TIME_SLOT_PICKER_VARIANTS.RANGE:
            return {
              start: minValidDate([parseISO(values.startTime), timeSlot.start]),
              end: maxValidDate([parseISO(values.endTime), timeSlot.end]),
            };
          case TIME_SLOT_PICKER_VARIANTS.START:
            return {
              start: timeSlot.start,
              end: dayEnd,
            };
          case TIME_SLOT_PICKER_VARIANTS.END:
            return {
              start: dayStart,
              end: timeSlot.end,
            };
        }
      };
      const targetSelection = getTargetSelection();

      return !bookedIntervals.some(interval => areIntervalsOverlapping(targetSelection, interval));
    },
    [bookedIntervals, dayEnd, dayStart, values.endTime, values.startTime, variant],
  );

  /**
   * Treating the `startTime` and `endTime` string values from the Formik context as the source of
   * truth, synchronise this {@link TimeSlotPicker}’s selection of {@link ToggleButton}s with the
   * currently selected start and end times.
   *
   * - If the user switches from an overnight booking to non-, preserve only the earliest time
   *   slot.
   * - If the user switches from a non-overnight booking to overnight, attempt to preserve the
   *   starting time slot. If this {@link TimeSlotPicker} would result in a selection that
   *   conflicts with another appointment, clear the start and/or end times as needed to maintain
   *   legal state.
   * - There’s no good heuristic for mapping end times between overnight and non-, so end times are
   *   simply discarded when toggling the `overnight` checkbox.
   *
   * The `appointments.bookingSlots` configuration may have changed since the last time a given
   * appointment was updated. This `useEffect` hook realigns an appointment’s start and end times
   * with the currently available slots.
   */
  useEffect(() => {
    if (hasNoLegalSelection) {
      setSelectedToggles([]);
      updateInterval({ end: null });
      return;
    }

    // Not a destructure to convince linter we don’t need `values` as object dependency
    const startTime = values.startTime;
    const endTime = values.endTime;

    if (variant === TIME_SLOT_PICKER_VARIANTS.RANGE) {
      if (!startTime) {
        setSelectedToggles([]);
        return;
      }

      if (!endTime) {
        const start = parseISO(startTime);
        const slot = slotContaining(start);
        setSelectedToggles([idOfTimeSlot(slot)]);
        updateInterval(slot);
        return;
      }

      const interval = appointmentToInterval({ startTime, endTime });
      setSelectedToggles(
        timeSlots?.filter(slot => areIntervalsOverlapping(slot, interval)).map(idOfTimeSlot),
      );
      updateInterval(interval);
      return;
    }

    if (variant === TIME_SLOT_PICKER_VARIANTS.START) {
      if (!startTime) {
        setSelectedToggles([]);
        return;
      }

      const start = parseISO(startTime);
      const hasConflict = bookedIntervals.some(interval =>
        areIntervalsOverlapping({ start, end: dayEnd }, interval),
      );
      if (hasConflict) {
        setSelectedToggles([]);
        updateInterval({ start: null });
        return;
      }

      const startValue = start.valueOf();
      setSelectedToggles(timeSlots?.map(idOfTimeSlot).filter(slotId => slotId >= startValue));
      updateInterval({ start });
      return;
    }

    if (variant === TIME_SLOT_PICKER_VARIANTS.END) {
      if (!endTime) {
        setSelectedToggles([]);
        return;
      }

      const end = parseISO(endTime);
      const endValue = end.valueOf();
      setSelectedToggles(timeSlots?.map(idOfTimeSlot).filter(slotId => slotId < endValue));
      updateInterval({ end });
      return;
    }
  }, [
    bookedIntervals,
    dayEnd,
    hasNoLegalSelection,
    slotContaining,
    timeSlots,
    updateInterval,
    values.endTime,
    values.startTime,
    variant,
  ]);

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  useEffect(() => {
    if (isSubmitting) setHasAttemptedSubmit(true);
  }, [isSubmitting]);

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
        {isFetchingExistingBookings || isTimeSlotsPending ? (
          <PlaceholderTimeSlotToggles />
        ) : (
          timeSlots?.map(timeSlot => {
            const isBooked = bookedIntervals.some(bookedInterval =>
              areIntervalsOverlapping(timeSlot, bookedInterval),
            );
            const id = idOfTimeSlot(timeSlot);

            const onMouseEnter = () => {
              if (selectedToggles.length > 1) return;

              if (variant === TIME_SLOT_PICKER_VARIANTS.RANGE) {
                if (!values.startTime || !values.endTime) {
                  setHoverRange(timeSlot);
                  return;
                }

                setHoverRange({
                  start: min([timeSlot.start, parseISO(values.startTime)]),
                  end: max([timeSlot.end, parseISO(values.endTime)]),
                });
                return;
              }

              if (selectedToggles.length > 0) return;

              if (variant === TIME_SLOT_PICKER_VARIANTS.START) {
                setHoverRange({
                  start: timeSlot.start,
                  end: dayEnd,
                });
                return;
              }

              // END variant
              setHoverRange({
                start: dayStart,
                end: timeSlot.end,
              });
            };

            return (
              <TimeSlotToggle
                booked={isBooked}
                conflictTooltipTitle={CONFLICT_TOOLTIP_TITLE[variant]}
                disabled={disabled}
                inHoverRange={hoverRange ? isIntervalWithinInterval(timeSlot, hoverRange) : false}
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
  date: PropTypes.string,
  disabled: PropTypes.bool,
  hasNoLegalSelection: PropTypes.bool,
  label: PropTypes.elementType,
  required: PropTypes.bool,
  variant: PropTypes.oneOf(Object.values(TIME_SLOT_PICKER_VARIANTS)),
};

TimeSlotPicker.defaultProps = {
  date: undefined,
  disabled: false,
  hasNoLegalSelection: false,
  label: undefined,
  required: false,
  variant: TIME_SLOT_PICKER_VARIANTS.RANGE,
};
