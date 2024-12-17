import FormHelperText, { formHelperTextClasses } from '@mui/material/FormHelperText';
import ToggleButtonGroup, { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';
import {
  addMilliseconds,
  areIntervalsOverlapping,
  max,
  min,
  parseISO,
  startOfDay,
  startOfToday,
} from 'date-fns';
import { useFormikContext } from 'formik';
import { isEqual } from 'lodash';
import ms from 'ms';
import { PropTypes } from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

import {
  endpointsOfDay,
  isIntervalWithinInterval,
  isWithinIntervalExcludingEnd,
  maxValidDate,
  minValidDate,
  toDateTimeString,
} from '@tamanu/shared/utils/dateTime';

import { useLocationBookingsQuery } from '../../../../api/queries';
import { Colors } from '../../../../constants';
import { useBookingSlotSettings } from '../../../../hooks/useBookingSlotSettings';
import { useBookingTimeSlots } from '../../../../hooks/useBookingTimeSlots';
import { OuterLabelFieldWrapper } from '../../../Field';
import { SkeletonTimeSlotToggles, TimeSlotToggle } from './TimeSlotToggle';
import { CONFLICT_TOOLTIP_TITLE, TIME_SLOT_PICKER_VARIANTS } from './constants';
import {
  appointmentToInterval,
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

const idOfTimeSlot = timeSlot => timeSlot.start.valueOf();

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
  const parsedDate = useMemo(() => (date ? startOfDay(parseISO(date)) : null), [date]);
  const [dayStart, dayEnd] = useMemo(
    () => (parsedDate ? endpointsOfDay(parsedDate) : [null, null]),
    [parsedDate],
  );

  const {
    initialValues: { startTime: initialStart, endTime: initialEnd },
    setFieldValue,
    values,
    errors,
    isSubmitting,
  } = useFormikContext();

  const { slotDuration } = useBookingSlotSettings();
  const slotDurationMs = ms(slotDuration);

  // Fall back to arbitrary day so time slots render. Prevents GUI from looking broken when no
  // date is selected, but component should be disabled in this scenario
  const timeSlots = useBookingTimeSlots(parsedDate ?? startOfToday());

  const slotContaining = useCallback(
    time => timeSlots.find(slot => isWithinIntervalExcludingEnd(time, slot)),
    [timeSlots],
  );

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
      ? timeSlots.filter(slot => areIntervalsOverlapping(slot, initialInterval)).map(idOfTimeSlot)
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

  /** @privateRemarks Assumes it is provided the start time of a valid slot */
  const endOfSlotStartingAt = useCallback(
    slotStartTime => addMilliseconds(slotStartTime, slotDurationMs),
    [slotDurationMs],
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
          const end = endOfSlotStartingAt(start);
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
          const end = endOfSlotStartingAt(new Date(newToggles.at(-1)));
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
          updateInterval({ end: endOfSlotStartingAt(startOfLastSlot) });
          return;
        }

        // Fresh selection. Select this and all preceding time slots
        if (newToggles.length === 1 && !isSameArrayMinusHead(newToggles, selectedToggles)) {
          //                           ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Carves out
          //                           the scenario where only the earliest two slots were selected,
          //                           and user tries to toggle off the earliest slot, which would
          //                           leave only the second-earliest slot selected (illegally)
          const startOfTimeSlot = new Date(newToggles[0]);
          updateInterval({ end: endOfSlotStartingAt(startOfTimeSlot) });
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
      const getTargetSelection = timeSlot => {
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
      const targetSelection = getTargetSelection(timeSlot);

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
      console.log('  hasNoLegalSelection');
      setSelectedToggles([]);
      updateInterval({ end: null });
      return;
    }

    // Not a destructure to convince linter we don’t need `values` as object dependency
    const startTime = values.startTime;
    const endTime = values.endTime;

    if (variant === TIME_SLOT_PICKER_VARIANTS.RANGE) {
      console.log('  range');
      if (!startTime) {
        console.log('    no start time');
        setSelectedToggles([]);
        return;
      }

      if (!endTime) {
        console.log('    no end time');
        const start = parseISO(startTime);
        const slot = slotContaining(start);
        setSelectedToggles([idOfTimeSlot(slot)]);
        updateInterval(slot);

        return;
      }

      console.log('    has both start and end');

      const interval = appointmentToInterval({ startTime, endTime });
      setSelectedToggles(
        timeSlots.filter(slot => areIntervalsOverlapping(slot, interval)).map(idOfTimeSlot),
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
      setSelectedToggles(timeSlots.map(idOfTimeSlot).filter(slotId => slotId >= startValue));
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
      setSelectedToggles(timeSlots.map(idOfTimeSlot).filter(slotId => slotId < endValue));
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
