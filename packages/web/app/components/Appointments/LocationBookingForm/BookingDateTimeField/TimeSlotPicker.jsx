import { CircularProgress } from '@material-ui/core';
import { ToggleButtonGroup, toggleButtonGroupClasses } from '@mui/material';
import { addMilliseconds as addMs, endOfDay, startOfDay, startOfToday } from 'date-fns';
import { useFormikContext } from 'formik';
import { PropTypes } from 'prop-types';
import React, { useCallback, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

import ms from 'ms';
import { useAppointmentsQuery } from '../../../../api/queries';
import { Colors } from '../../../../constants';
import { useSettings } from '../../../../contexts/Settings';
import { OuterLabelFieldWrapper } from '../../../Field';
import { BookingTimeCell } from './BookingTimeCell';
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

const LoadingIndicator = styled(CircularProgress)`
  grid-column: 1 / -1;
  margin: 0 auto;
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
  const { setFieldValue, values } = useFormikContext();

  /**
   * Array of integers representing the selected toggle buttons. Each time slot is represented by
   * the integer form of its start time.
   */
  const [selectedToggles, setSelectedToggles] = useState([]); // TODO
  const [hoverRange, setHoverRange] = useState(null);

  const { getSetting } = useSettings();
  const bookingSlotSettings = getSetting('appointments.bookingSlots');

  // Fall back to arbitrary day so time slots render. Prevents GUI from looking broken when no date
  // is selected, but component should be disabled in this scenario
  const timeSlots = calculateTimeSlots(bookingSlotSettings, date ?? startOfToday());

  const { data: existingLocationBookings, isFetching, isFetched } = useAppointmentsQuery(
    {
      after: date ? toDateTimeString(startOfDay(date)) : null,
      before: date ? toDateTimeString(endOfDay(date)) : null,
      all: true,
      locationId: values.locationId,
    },
    {
      enabled: !!(date && values.locationId),
    },
  );

  const updateSelection = (newToggleSelection, newStartTime, newEndTime) => {
    setSelectedToggles(newToggleSelection);
    void setFieldValue('startTime', newStartTime);
    void setFieldValue('endTime', newEndTime);
  };

  /**
   * @param {Array<int>} newToggles Provided by MUI Toggle Button Group. This function coerces this
   * into a contiguous selection.
   */
  const handleChange = (event, newToggles) => {
    switch (variant) {
      case 'range': {
        // Deselecting the only selected time slot
        if (newToggles.length === 0) {
          updateSelection([], null, null);
          break;
        }

        // Fresh selection
        if (newToggles.length === 1) {
          const newStart = new Date(newToggles[0]);
          const newEnd = addMs(newStart, ms(bookingSlotSettings.slotDuration));
          updateSelection(newToggles, newStart, newEnd);
          break;
        }

        // One time slot already selected. A second one makes a contiguous series.
        // (Selecting tail before head is allowed.)
        if (selectedToggles.length === 1) {
          const newStart = new Date(newToggles[0]);
          const newEnd = addMs(new Date(newToggles.at(-1)), ms(bookingSlotSettings.slotDuration));
          const newTimeRange = { start: newStart, end: newEnd };
          const newSelection = timeSlots
            .filter(s => isTimeSlotWithinRange(s, newTimeRange))
            .map(({ start }) => start.valueOf());
          updateSelection(newSelection, newStart, newEnd);
          break;
        }

        // Many time slots already selected. User may shorten the selection by deselecting only the
        // first or last slot.
        if (isSameArrayMinusHeadOrTail(newToggles, selectedToggles)) {
          const newStart = new Date(newToggles[0]);
          const newEnd = addMs(new Date(newToggles.at(-1)), ms(bookingSlotSettings.slotDuration));
          const newSelection = newToggles;
          updateSelection(newSelection, newStart, newEnd);
          break;
        }

        // Many time slots selected. Clicking anything other than the head or tail clears the
        // selection.
        updateSelection([], null, null);
        setHoverRange(null);
        break;
      }
      case 'start': {
        // TODO
        break;
      }
      case 'end': {
        // TODO
        break;
      }
    }

    onChange?.(event, { start: values.startTime, end: values.endTime });
  };

  // Convert existing bookings into timeslots TODO: Exclude slots that this form edits
  const bookedTimeSlots = useMemo(() => {
    if (!isFetched) return [];
    return existingLocationBookings?.data.map(booking => ({
      start: new Date(booking.startTime),
      end: new Date(booking.endTime),
    }));
  }, [existingLocationBookings, isFetched]);

  /** Watch out! startTime and endTime values are strings. */
  const checkIfSelectableTimeSlot = useCallback(
    timeSlot => {
      if (!values.startTime || !values.endTime) return true;
      if (values.startTime < timeSlot.end) {
        return !bookedTimeSlots.some(bookedSlot =>
          isTimeSlotWithinRange(bookedSlot, {
            start: values.startTime,
            end: timeSlot.end,
          }),
        );
      }
      if (values.endTime > timeSlot.start) {
        return !bookedTimeSlots.some(bookedSlot =>
          isTimeSlotWithinRange(bookedSlot, {
            start: timeSlot.start,
            end: values.endTime,
          }),
        );
      }
    },
    [bookedTimeSlots, values.startTime, values.endTime],
  );

  return (
    <OuterLabelFieldWrapper label={label} required={required}>
      <ToggleGroup disabled={disabled} value={selectedToggles} onChange={handleChange} {...props}>
        {isFetching ? (
          <LoadingIndicator />
        ) : (
          timeSlots.map(timeSlot => {
            const isBooked = bookedTimeSlots?.some(bookedTimeSlot =>
              isTimeSlotWithinRange(timeSlot, bookedTimeSlot),
            );

            const onMouseEnter = () => {
              if (selectedToggles.length > 1) return;

              if (!values.startTime || !values.endTime) {
                setHoverRange(timeSlot);
                return;
              }
              if (timeSlot.start <= values.startTime) {
                setHoverRange({
                  start: timeSlot.start,
                  end: values.endTime,
                });
                return;
              }
              if (timeSlot.end >= values.endTime) {
                setHoverRange({
                  start: values.startTime,
                  end: timeSlot.end,
                });
                return;
              }
            };

            return (
              <BookingTimeCell
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
  onChange: PropTypes.func,
  variant: PropTypes.oneOf(['range', 'start', 'end']),
};

TimeSlotPicker.defaultProps = {
  date: startOfToday(),
  disabled: false,
  onChange: null,
  variant: 'range',
};
