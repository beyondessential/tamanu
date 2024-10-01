import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { OuterLabelFieldWrapper } from '../../Field';
import { Colors } from '../../../constants';
import {
  addMinutes,
  parse,
  differenceInMinutes,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from 'date-fns';
import ms from 'ms';
import { useSettings } from '../../../contexts/Settings';
import { useAppointments } from '../../../api/queries/useAppointments';
import { BookingTimeCell } from './BookingTimeCell';
import { useFormikContext } from 'formik';
import { toDateTimeString } from '../../../utils/dateTime';
import { isEqual } from 'lodash';
import { CircularProgress } from '@material-ui/core';

const CellContainer = styled.div`
  border: 1px solid ${Colors.outline};
  background-color: ${({ $disabled }) => ($disabled ? 'initial' : 'white')};
  width: 295px;
  padding: 11px 14px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const LoadingIndicator = styled(CircularProgress)`
  grid-column: 1 / -1;
  margin: 0 auto;
`;

const calculateTimeSlots = (bookingSlotSettings, date) => {
  const { startTime, endTime, slotDuration } = bookingSlotSettings;
  const startOfDay = parse(startTime, 'HH:mm', new Date(date ? date : null));
  const endOfDay = parse(endTime, 'HH:mm', new Date(date ? date : null));
  const durationMinutes = ms(slotDuration) / 60_000; // In minutes

  const totalSlots = differenceInMinutes(endOfDay, startOfDay) / durationMinutes;
  const slots = [];
  for (let i = 0; i < totalSlots; i++) {
    const start = addMinutes(startOfDay, i * durationMinutes);
    const end = addMinutes(start, durationMinutes);
    slots.push({
      start,
      end,
    });
  }

  return slots;
};

const isTimeSlotWithinRange = (timeSlot, range) => {
  if (!range) return false;
  return isWithinInterval(timeSlot.start, range) && isWithinInterval(timeSlot.end, range);
};

// logic calculated through time ranges in the format { start: DATE, end: DATE }
export const BookingTimeField = ({ disabled = false }) => {
  const { getSetting } = useSettings();
  const { setFieldValue, values, dirty } = useFormikContext();

  const [selectedTimeRange, setSelectedTimeRange] = useState(null);
  const [hoverTimeRange, setHoverTimeRange] = useState(null);

  const { locationId, date } = values;
  const { data: existingLocationBookings, isFetched } = useAppointments({
    after: date ? toDateTimeString(startOfDay(new Date(date))) : null,
    before: date ? toDateTimeString(endOfDay(new Date(date))) : null,
    all: true,
    locationId,
  });

  // Convert existing bookings into timeslots
  const bookedTimeSlots = useMemo(
    () =>
      isFetched
        ? existingLocationBookings?.data.map(booking => ({
            start: new Date(booking.startTime),
            end: new Date(booking.endTime),
          }))
        : [],
    [existingLocationBookings, isFetched],
  );

  // TODO: temporary default for dev
  const bookingSlotSettings = getSetting('appointments.bookingSlots') || {
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: '30min',
  };
  const timeSlots = useMemo(() => calculateTimeSlots(bookingSlotSettings, values.date), [
    values.date,
  ]);

  useEffect(() => {
    if (dirty) {
      const startTime = selectedTimeRange ? toDateTimeString(selectedTimeRange.start) : null;
      const endTime = selectedTimeRange ? toDateTimeString(selectedTimeRange.end) : null;
      setFieldValue('startTime', startTime);
      setFieldValue('endTime', endTime);
    }
  }, [selectedTimeRange, setFieldValue, dirty]);

  useEffect(() => {
    if (!values.startTime) setSelectedTimeRange(null);
  }, [values]);

  const updateTimeRangeStart = start =>
    setSelectedTimeRange(prevRange => ({
      ...prevRange,
      start,
    }));

  const updateTimeRangeEnd = end =>
    setSelectedTimeRange(prevRange => ({
      ...prevRange,
      end,
    }));

  const addSelectedTimeSlot = useCallback(
    timeSlot => {
      if (!selectedTimeRange) {
        setSelectedTimeRange(timeSlot);
        return;
      }
      if (timeSlot.start < selectedTimeRange.start) {
        updateTimeRangeStart(timeSlot.start);
        return;
      }
      if (timeSlot.end > selectedTimeRange.end) {
        updateTimeRangeEnd(timeSlot.end);
        return;
      }
    },
    [selectedTimeRange],
  );

  const removeSelectedTimeSlot = useCallback(
    timeSlot => {
      if (
        isEqual(timeSlot.start, selectedTimeRange.start) &&
        isEqual(timeSlot.end, selectedTimeRange.end)
      ) {
        setSelectedTimeRange(null);
        setHoverTimeRange(timeSlot);
        return;
      }

      if (isEqual(timeSlot.start, selectedTimeRange.start)) {
        updateTimeRangeStart(timeSlot.end);
        return;
      }
      if (isEqual(timeSlot.end, selectedTimeRange.end)) {
        updateTimeRangeEnd(timeSlot.start);
        return;
      }

      setSelectedTimeRange(null);
      setHoverTimeRange(timeSlot);
      return;
    },
    [selectedTimeRange],
  );

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

  return (
    <OuterLabelFieldWrapper label="Booking time" required>
      <CellContainer $disabled={disabled}>
        {!date || isFetched ? (
          timeSlots.map((timeSlot, index) => {
            const isSelected = isTimeSlotWithinRange(timeSlot, selectedTimeRange);
            const isBooked = bookedTimeSlots?.some(bookedTimeSlot =>
              isTimeSlotWithinRange(timeSlot, bookedTimeSlot),
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
                key={index}
                timeSlot={timeSlot}
                selected={isSelected}
                selectable={checkIfSelectableTimeSlot(timeSlot)}
                booked={isBooked}
                disabled={disabled}
                onClick={() =>
                  isSelected ? removeSelectedTimeSlot(timeSlot) : addSelectedTimeSlot(timeSlot)
                }
                onMouseEnter={onMouseEnter}
                onMouseLeave={() => setHoverTimeRange(null)}
                inHoverRange={isTimeSlotWithinRange(timeSlot, hoverTimeRange)}
              />
            );
          })
        ) : (
          <LoadingIndicator />
        )}
      </CellContainer>
    </OuterLabelFieldWrapper>
  );
};
