import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { OuterLabelFieldWrapper } from '../Field';
import { Colors } from '../../constants';
import {
  addMinutes,
  parse,
  differenceInMinutes,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from 'date-fns';
import ms from 'ms';
import { useSettings } from '../../contexts/Settings';
import { isUndefined, max, min, range } from 'lodash';
import { useAppointments } from '../../api/queries/useAppointments';
import { BookingTimeCell } from './BookingTimeCell';
import { useFormikContext } from 'formik';
import { toDateTimeString } from '../../utils/dateTime';

const CellContainer = styled.div`
  border: 1px solid ${Colors.outline};
  background-color: ${({ $disabled }) => ($disabled ? 'initial' : 'white')};
  width: 300px;
  padding: 11px 14px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const calculateTimeSlots = bookingSlotSettings => {
  const { startTime, endTime, slotDuration } = bookingSlotSettings;
  const startOfDay = parse(startTime, 'HH:mm', new Date());
  const endOfDay = parse(endTime, 'HH:mm', new Date());
  const duration = ms(slotDuration) / 60000; // In minutes

  const totalSlots = differenceInMinutes(endOfDay, startOfDay) / duration;
  const slots = [];
  for (let i = 0; i < totalSlots; i++) {
    const start = addMinutes(startOfDay, i * duration);
    const end = addMinutes(start, duration);

    slots.push({
      start,
      end,
    });
  }

  return slots;
};

const isTimeSlotWithinRange = (timeSlot, range) =>
  isWithinInterval(timeSlot.start, range) && isWithinInterval(timeSlot.end, range);

// logic calculated through time ranges in the format { start: DATE, end: DATE }

export const BookingTimeField = ({ disabled = false }) => {
  const { getSetting } = useSettings();
  const { setFieldValue, values } = useFormikContext();

  const [selectedTimeRange, setSelectedTimeRange] = useState(null);
  const [hoverTimeRange, setHoverTimeRange] = useState(null);

  const { locationId, date } = values;
  const { data: existingLocationBookings, isFetched } = useAppointments({
    after: toDateTimeString(startOfDay(date)),
    before: toDateTimeString(endOfDay(date)),
    all: true,
    locationId,
  });

  // Convert existing bookings into timeslots
  const bookedTimeSlots = existingLocationBookings?.data.map(booking => ({
    start: new Date(booking.startTime),
    end: new Date(booking.endTime),
  }));

  const bookingSlotSettings = getSetting('appointments.bookingSlots');

  const timeSlots = useMemo(() => {
    return isFetched ? calculateTimeSlots(bookingSlotSettings) : [];
  }, [bookingSlotSettings, isFetched]);

  useEffect(() => {
    if (selectedTimeRange) {
      setFieldValue('startTime', toDateTimeString(selectedTimeRange.start));
      setFieldValue('endTime', toDateTimeString(selectedTimeRange.end));
    }
  }, [selectedTimeRange, setFieldValue]);

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
      if (timeSlot.start === selectedTimeRange.start) {
        updateTimeRangeStart(timeSlot.end);
        return;
      }
      if (timeSlot.end === selectedTimeRange.end) {
        updateTimeRangeEnd(timeSlot.start);
        return;
      }
      // If not extending range, reset
      setSelectedTimeRange(null);
      setHoverTimeRange(timeSlot);
    },
    [selectedTimeRange],
  );

  return (
    <OuterLabelFieldWrapper label="Booking time" required>
      <CellContainer $disabled={disabled}>
        {timeSlots.map((timeSlot, index) => {
          const isSelected =
            selectedTimeRange && isTimeSlotWithinRange(timeSlot, selectedTimeRange);
          const isBooked = bookedTimeSlots.some(bookedTimeSlot =>
            isTimeSlotWithinRange(timeSlot, bookedTimeSlot),
          );
          const onMouseEnter = () => {
            if (!selectedTimeRange) {
              return setHoverTimeRange(timeSlot);
            }
            if (timeSlot.start <= selectedTimeRange.start) {
              return setHoverTimeRange({
                start: timeSlot.start,
                end: selectedTimeRange.end,
              });
            }
            if (timeSlot.end >= selectedTimeRange.end) {
              return setHoverTimeRange({
                start: selectedTimeRange.start,
                end: timeSlot.end,
              });
            }
          };

          return (
            <BookingTimeCell
              key={index}
              timeSlot={timeSlot}
              selected={isSelected}
              booked={isBooked}
              disabled={disabled}
              onClick={() =>
                isSelected ? removeSelectedTimeSlot(timeSlot) : addSelectedTimeSlot(timeSlot)
              }
              onMouseEnter={onMouseEnter}
              onMouseLeave={() => setHoverTimeRange(null)}
              withinHoverRange={
                hoverTimeRange ? isTimeSlotWithinRange(timeSlot, hoverTimeRange) : null
              }
              invalidTarget={
                hoverTimeRange &&
                bookedTimeSlots.some(bookedslot =>
                  isTimeSlotWithinRange(bookedslot, hoverTimeRange),
                )
              }
            />
          );
        })}
      </CellContainer>
    </OuterLabelFieldWrapper>
  );
};
