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
import { useAppointments } from '../../api/queries/useAppointments';
import { BookingTimeCell } from './BookingTimeCell';
import { useFormikContext } from 'formik';
import { toDateTimeString } from '../../utils/dateTime';
import { isEqual } from 'lodash';

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

const isTimeSlotWithinRange = (timeSlot, range) => {
  if (!range) return false;
  return isWithinInterval(timeSlot.start, range) && isWithinInterval(timeSlot.end, range);
};

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
    } else {
      setFieldValue('startTime', null);
      setFieldValue('endTime', null);
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
        {timeSlots.map((timeSlot, index) => {
          const isSelected = isTimeSlotWithinRange(timeSlot, selectedTimeRange);
          const isBooked = bookedTimeSlots.some(bookedTimeSlot =>
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
        })}
      </CellContainer>
    </OuterLabelFieldWrapper>
  );
};
