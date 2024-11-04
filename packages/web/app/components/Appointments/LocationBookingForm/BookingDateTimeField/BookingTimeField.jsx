import { CircularProgress } from '@material-ui/core';
import { toggleButtonClasses, ToggleButtonGroup } from '@mui/material';
import { addMilliseconds, endOfDay, startOfDay } from 'date-fns';
import { useFormikContext } from 'formik';
import { isEqual } from 'lodash';
import ms from 'ms';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { useAppointmentsQuery } from '../../../../api/queries';
import { Colors } from '../../../../constants';
import { useSettings } from '../../../../contexts/Settings';
import { toDateTimeString } from '../../../../utils/dateTime';
import { OuterLabelFieldWrapper } from '../../../Field';
import { TranslatedText } from '../../../Translation/TranslatedText';
import { BookingTimeCell } from './BookingTimeCell';
import { calculateTimeSlots, isTimeSlotWithinRange } from './util';

const ToggleGroup = styled(ToggleButtonGroup)`
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  inline-size: 295px;
  padding-block: 0.75rem;
  padding-inline: 1rem;

  &.MuiToggleButtonGroup-root {
    display: grid;
    gap: 0.5rem 0.75rem;
    grid-template-columns: repeat(2, 1fr);
  }

  &.${toggleButtonClasses.disabled} {
    background-color: initial;
  }
`;

const LoadingIndicator = styled(CircularProgress)`
  grid-column: 1 / -1;
  margin: 0 auto;
`;

/** logic calculated through time ranges in the format { start: DATE, end: DATE } */
export const BookingTimeField = ({ disabled = false }) => {
  const { setFieldValue, values, initialValues } = useFormikContext();

  const initialTimeRange = useMemo(() => {
    if (!initialValues.startTime) return null;
    return {
      start: new Date(initialValues.startTime),
      end: new Date(initialValues.endTime),
    };
  }, [initialValues.endTime, initialValues.startTime]);

  /**
   * The underlying datetime range selected by this component, independent of time slots.
   * { start: Date, end: Date }
   */
  const [selectedTimeRange, setSelectedTimeRange] = useState(initialTimeRange);
  /**
   * Array of integers representing the selected toggle buttons. Each time slot is represented by
   * the integer form of its start time.
   */
  const [selectedToggles, setSelectedToggles] = useState(initialValues?.startTime?.valueOf() ?? []);

  const [hoverTimeRange, setHoverTimeRange] = useState(null);

  const { locationId, date } = values;
  const { data: existingLocationBookings, isFetching, isFetched } = useAppointmentsQuery(
    {
      after: date ? toDateTimeString(startOfDay(new Date(date))) : null,
      before: date ? toDateTimeString(endOfDay(new Date(date))) : null,
      all: true,
      locationId,
    },
    {
      enabled: !!(date && locationId),
    },
  );

  // Convert existing bookings into timeslots
  const bookedTimeSlots = useMemo(() => {
    if (!isFetched) return [];
    return existingLocationBookings?.data
      .map(booking => ({
        start: new Date(booking.startTime),
        end: new Date(booking.endTime),
      }))
      .filter(slot => !isEqual(slot, initialTimeRange)); // Dont include the existing booking in the booked time logic
  }, [existingLocationBookings, isFetched, initialTimeRange]);

  const { getSetting } = useSettings();
  const bookingSlotSettings = getSetting('appointments.bookingSlots');
  const timeSlots = calculateTimeSlots(bookingSlotSettings, values.date);

  const checkIfSelectableTimeSlot = useCallback(
    timeSlot => {
      if (!selectedTimeRange) return true;
      if (selectedTimeRange.start < timeSlot.end) {
        return !bookedTimeSlots.some(bookedslot =>
          isTimeSlotWithinRange(bookedslot, {
            start: selectedTimeRange.start,
            end: timeSlot.end,
          }),
        );
      }
      if (selectedTimeRange.end > timeSlot.start) {
        return !bookedTimeSlots.some(bookedslot =>
          isTimeSlotWithinRange(bookedslot, {
            start: timeSlot.start,
            end: selectedTimeRange.end,
          }),
        );
      }
    },
    [selectedTimeRange, bookedTimeSlots],
  );

  const updateTimeRange = newTimeRange => {
    setSelectedTimeRange(newTimeRange);
    void setFieldValue('startTime', newTimeRange.start);
    void setFieldValue('endTime', newTimeRange.end);
  };

  const handleChange = (_event, newTimeSlots) => {
    if (newTimeSlots.length === 0) {
      setSelectedToggles([]);
      setSelectedTimeRange(null);
      return;
    }

    const sortedTimeSlots = newTimeSlots.toSorted();
    const newStart = new Date(sortedTimeSlots[0]);
    const newEnd = addMilliseconds(
      new Date(sortedTimeSlots.at(-1)),
      ms(bookingSlotSettings.slotDuration),
    );
    const newTimeRange = { start: newStart, end: newEnd };

    // Update toggle button group state
    const newToggleSelection = timeSlots
      .filter(s => isTimeSlotWithinRange(s, newTimeRange))
      .map(({ start }) => start.valueOf());
    setSelectedToggles(newToggleSelection);

    // Update semantic datetime range selection
    updateTimeRange(newTimeRange);
  };

  return (
    <OuterLabelFieldWrapper
      label={
        <TranslatedText stringId="locationBooking.bookingTime.label" fallback="Booking time" />
      }
      required
    >
      <ToggleGroup $disabled={disabled} value={selectedToggles} onChange={handleChange}>
        {isFetching ? (
          <LoadingIndicator />
        ) : (
          timeSlots.map(timeSlot => {
            const isSelected = isTimeSlotWithinRange(timeSlot, selectedTimeRange);
            const isBooked = bookedTimeSlots?.some(
              bookedTimeSlot => isTimeSlotWithinRange(timeSlot, bookedTimeSlot) && !isSelected,
            );

            const onMouseEnter = () => {
              if (!selectedTimeRange) {
                setHoverTimeRange(timeSlot);
                return;
              }
              if (timeSlot.start <= selectedTimeRange.start) {
                setHoverTimeRange({
                  start: timeSlot.start,
                  end: selectedTimeRange.end,
                });
                return;
              }
              if (timeSlot.end >= selectedTimeRange.end) {
                setHoverTimeRange({
                  start: selectedTimeRange.start,
                  end: timeSlot.end,
                });
                return;
              }
            };

            return (
              <BookingTimeCell
                key={timeSlot.start.valueOf()}
                timeSlot={timeSlot}
                selected={isSelected}
                selectable={checkIfSelectableTimeSlot(timeSlot)}
                booked={isBooked}
                disabled={disabled}
                onMouseEnter={onMouseEnter}
                onMouseLeave={() => setHoverTimeRange(null)}
                inHoverRange={isTimeSlotWithinRange(timeSlot, hoverTimeRange)}
                value={timeSlot.start.valueOf()}
              />
            );
          })
        )}
      </ToggleGroup>
    </OuterLabelFieldWrapper>
  );
};
