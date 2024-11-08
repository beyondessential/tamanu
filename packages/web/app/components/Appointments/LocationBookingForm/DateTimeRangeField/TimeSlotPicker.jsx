import { ToggleButtonGroup, toggleButtonGroupClasses } from '@mui/material';
import {
  addMilliseconds as addMs,
  areIntervalsOverlapping,
  endOfDay,
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
import React, { useCallback, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useAppointmentsQuery } from '../../../../api/queries';
import { Colors } from '../../../../constants';
import { useSettings } from '../../../../contexts/Settings';
import { OuterLabelFieldWrapper } from '../../../Field';
import { SkeletonTimeSlotToggles, TimeSlotToggle } from './TimeSlotToggle';
import { calculateTimeSlots, isSameArrayMinusHeadOrTail, isTimeSlotWithinRange } from './util';

const ToggleGroup = styled(ToggleButtonGroup)`
  background-color: white;
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  padding-block: 0.75rem;
  padding-inline: 1rem;

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

export const TimeSlotPicker = ({
  date,
  disabled = false,
  label,
  onChange,
  required,
  variant = 'range',
  ...props
}) => {
  const {
    initialValues: { startTime: initialStart, endTime: initialEnd },
    setFieldValue,
    values,
  } = useFormikContext();

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
  const [selectedToggles, setSelectedToggles] = useState(
    initialTimeRange
      ? timeSlots
          .filter(s => areIntervalsOverlapping(s, initialTimeRange))
          .map(({ start }) => start.valueOf())
      : null,
  );
  const [hoverRange, setHoverRange] = useState(null);

  const dateIsValid = isValid(date);
  const { data: existingLocationBookings, isFetching, isFetched } = useAppointmentsQuery(
    {
      after: dateIsValid ? toDateTimeString(startOfDay(date)) : null,
      before: dateIsValid ? toDateTimeString(endOfDay(date)) : null,
      all: true,
      locationId: values.locationId,
    },
    { enabled: dateIsValid && !!values.locationId },
  );

  const updateSelection = (newToggleSelection, { start: newStartTime, end: newEndTime }) => {
    setSelectedToggles(newToggleSelection);
    switch (variant) {
      case 'range':
        void setFieldValue('startTime', newStartTime);
        void setFieldValue('endTime', newEndTime);
        break;
      case 'start':
        void setFieldValue('startTime', newStartTime);
        break;
      case 'end':
        void setFieldValue('endTime', newEndTime);
        break;
    }
  };

  const endOfSlotStartingAt = slotStartTime => addMs(slotStartTime, slotDurationMs);

  /**
   * @param {Array<int>} newTogglesUnsorted Provided by MUI Toggle Button Group. This function
   * coerces this into a contiguous selection. Note that this array has set semantics, and is not
   * guaranteed to have its elements in natural order.
   */
  const handleChange = (event, newTogglesUnsorted) => {
    const newToggles = newTogglesUnsorted.toSorted();

    switch (variant) {
      case 'range': {
        // Deselecting the only selected time slot
        if (newToggles.length === 0) {
          updateSelection([], { start: null, end: null });
          break;
        }

        // Fresh selection
        if (newToggles.length === 1) {
          const newStart = new Date(newToggles[0]);
          const newEnd = endOfSlotStartingAt(newStart);
          updateSelection(newToggles, {
            start: newStart,
            end: newEnd,
          });
          break;
        }

        // One time slot already selected. A second one makes a contiguous series.
        // (Selecting tail before head is allowed.)
        if (selectedToggles.length === 1) {
          const newStart = new Date(newToggles[0]);
          const startOfLatestSlot = new Date(newToggles.at(-1));
          const newEnd = addMs(startOfLatestSlot, slotDurationMs);
          const newTimeRange = { start: newStart, end: newEnd };
          const newSelection = timeSlots
            .filter(s => areIntervalsOverlapping(s, newTimeRange))
            .map(({ start }) => start.valueOf());
          updateSelection(newSelection, newTimeRange);
          break;
        }

        // Many time slots already selected. User may shorten the selection by deselecting only the
        // first or last slot.
        if (isSameArrayMinusHeadOrTail(newToggles, selectedToggles)) {
          const newStart = new Date(newToggles[0]);
          const newEnd = addMs(new Date(newToggles.at(-1)), slotDurationMs);
          updateSelection(newToggles, { start: newStart, end: newEnd });
          break;
        }

        // Many time slots selected. Clicking anything other than the head or tail clears the
        // selection.
        updateSelection([], { start: null, end: null });
        setHoverRange(null);
        break;
      }
      case 'start': {
        // Deselecting the only selected time slot (necessarily the latest time slot of the day)
        if (newToggles.length === 0) {
          updateSelection([], { start: null });
          break;
        }

        // Fresh selection. Select this and all succeeding time slots
        if (newToggles.length === 1) {
          const [selectedToggle] = newToggles;
          const newSelection = timeSlots
            .map(({ start }) => start.valueOf())
            .filter(s => s >= selectedToggle);

          const newStart = new Date(selectedToggle);
          updateSelection(newSelection, { start: newStart });
        }

        // Many time slots already selected. Toggling any time slot updates the selection to make
        // that the new starting time slot.
        break;
      }
      case 'end': {
        // Deselecting the only selected time slot (necessarily the earliest time slot of the day)
        if (newToggles.length === 0) {
          updateSelection([], { end: null });
          break;
        }

        // Fresh selection. Select this and all preceding time slots
        if (newToggles.length === 1) {
          const [selectedToggle] = newToggles;
          const newSelection = timeSlots
            .map(({ start }) => start.valueOf())
            .filter(s => s <= selectedToggle);

          const startOfTimeSlot = new Date(selectedToggle);
          const newEnd = endOfSlotStartingAt(startOfTimeSlot);
          updateSelection(newSelection, { end: newEnd });
        }
        break;
      }
    }

    onChange?.(event, { start: values.startTime, end: values.endTime });
  };

  const bookedIntervals = useMemo(() => {
    if (!isFetched) return [];
    return existingLocationBookings?.data
      .map(booking => ({
        start: new Date(booking.startTime),
        end: new Date(booking.endTime),
      }))
      .filter(interval => !isEqual(interval, initialTimeRange)); // Ignore the booking currently being modified
  }, [existingLocationBookings?.data, initialTimeRange, isFetched]);

  /** A time slot is selectable if it does not create a selection of time slots that collides with another booking */
  const checkIfSelectableTimeSlot = useCallback(
    timeSlot => {
      // If beginning a fresh selection, discontinuity is impossible
      if (!values.startTime || !values.endTime) return true;

      // The would-be time range if this time slot were to be selected
      const targetSelection = {
        start: min([values.startTime, timeSlot.start]),
        end: max([values.endTime, timeSlot.end]),
      };

      return !bookedIntervals.some(bookedInterval =>
        areIntervalsOverlapping(targetSelection, bookedInterval),
      );
    },
    [bookedIntervals, values.startTime, values.endTime],
  );

  return (
    <OuterLabelFieldWrapper label={label} required={required}>
      <ToggleGroup disabled={disabled} value={selectedToggles} onChange={handleChange} {...props}>
        {isFetching ? (
          <SkeletonTimeSlotToggles />
        ) : (
          timeSlots.map(timeSlot => {
            const isBooked = bookedIntervals?.some(bookedInterval =>
              areIntervalsOverlapping(timeSlot, bookedInterval),
            );

            const onMouseEnter = () => {
              if (selectedToggles.length > 1) return;

              if (!values.startTime || !values.endTime) {
                setHoverRange(timeSlot);
                return;
              }

              setHoverRange({
                start: min([timeSlot.start, values.startTime]),
                end: max([timeSlot.end, values.endTime]),
              });
            };

            return (
              <TimeSlotToggle
                key={timeSlot.start.valueOf()}
                timeSlot={timeSlot}
                selectable={checkIfSelectableTimeSlot(timeSlot)}
                booked={isBooked}
                disabled={disabled}
                onMouseEnter={onMouseEnter}
                onMouseLeave={() => setHoverRange(null)}
                inHoverRange={isTimeSlotWithinRange(timeSlot, hoverRange)}
                value={timeSlot.start.valueOf()}
              />
            );
          })
        )}
      </ToggleGroup>
    </OuterLabelFieldWrapper>
  );
};

TimeSlotPicker.propTypes = {
  date: PropTypes.instanceOf(Date),
  disabled: PropTypes.bool,
  label: PropTypes.elementType,
  onChange: PropTypes.func,
  required: PropTypes.bool,
  variant: PropTypes.oneOf(['range', 'start', 'end']),
};

TimeSlotPicker.defaultProps = {
  date: startOfToday(),
  disabled: false,
  label: undefined,
  onChange: null,
  required: false,
  variant: 'range',
};
