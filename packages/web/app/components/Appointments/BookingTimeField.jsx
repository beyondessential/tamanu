import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { OuterLabelFieldWrapper } from '../Field';
import { Colors } from '../../constants';
import { addMinutes, parse, differenceInMinutes, startOfDay, endOfDay } from 'date-fns';
import ms from 'ms';
import { useSettings } from '../../contexts/Settings';
import { max, min, range } from 'lodash';
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

const checkIfLocationAvailable = (existingLocationBookings, startTime) =>
  !existingLocationBookings.some(appointment => {
    const appointmentStartMs = new Date(appointment.startTime).getTime();
    const appointmentEndMs = new Date(appointment.endTime).getTime();
    const slotStartMs = startTime.getTime();
    return appointmentStartMs <= slotStartMs && slotStartMs < appointmentEndMs;
  });

const calculateTimeSlots = (bookingSlotSettings, existingLocationBookings) => {
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
      startTime: start,
      endTime: end,
      available: checkIfLocationAvailable(existingLocationBookings, start),
    });
  }

  return slots;
};

export const BookingTimeField = ({ disabled = false }) => {
  const { getSetting } = useSettings();
  const { setFieldValue, values } = useFormikContext();

  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const lowestSelectedIndex = useMemo(() => min(selectedTimeSlots), [selectedTimeSlots]);
  const highestSelectedIndex = useMemo(() => max(selectedTimeSlots), [selectedTimeSlots]);

  const { locationId, date } = values;
  const { data: existingLocationBookings, isFetched } = useAppointments({
    after: toDateTimeString(startOfDay(new Date(date))),
    before: toDateTimeString(endOfDay(new Date(date))),
    all: true,
    locationId,
  });

  const bookingSlotSettings = getSetting('appointments.bookingSlots');

  const timeSlots = useMemo(() => {
    return isFetched ? calculateTimeSlots(bookingSlotSettings, existingLocationBookings.data) : [];
  }, [bookingSlotSettings, existingLocationBookings, isFetched]);

  useEffect(() => {
    setFieldValue('startTime', toDateTimeString(timeSlots[lowestSelectedIndex]?.startTime));
    setFieldValue('endTime', toDateTimeString(timeSlots[highestSelectedIndex]?.endTime));
  }, [lowestSelectedIndex, highestSelectedIndex, timeSlots, setFieldValue]);

  const calculateIndexRangeToAdd = index => {
    const indexesToAdd = [index];
    const shouldPopulateUp = index > highestSelectedIndex;
    const shouldPopulateDown = index < lowestSelectedIndex;
    // Autofill any numbers between the ends of current range and new selection
    if (shouldPopulateDown) indexesToAdd.push(...range(lowestSelectedIndex - 1, index));
    if (shouldPopulateUp) indexesToAdd.push(...range(highestSelectedIndex + 1, index));
    return indexesToAdd;
  };

  const checkIfIndexRangeContainsBookedTime = indexes =>
    indexes.some(
      item =>
        timeSlots
          .map((slot, index) => (!slot.available ? index : null)) // Map unavailable slots to their index, others to null
          .includes(item), // Check if any of the unavailable indexes matches one of the index range supplied
    );

  const removeSelectedIndex = index =>
    setSelectedTimeSlots(prevSelections => prevSelections.filter(selection => selection !== index));
  const addSelectedIndexes = indexesToAdd =>
    setSelectedTimeSlots(prevSelections => [...prevSelections, ...indexesToAdd]);

  const toggleSelectedTimeSlot = index => {
    if (selectedTimeSlots.length === 0) return addSelectedIndexes([index]);
    if (selectedTimeSlots.includes(index)) return removeSelectedIndex(index);
    return addSelectedIndexes(calculateIndexRangeToAdd(index));
  };

  return (
    <OuterLabelFieldWrapper label="Booking time" required>
      <CellContainer $disabled={disabled}>
        {timeSlots.map((timeSlot, index) => {
          return (
            <BookingTimeCell
              key={index}
              timeSlot={timeSlot}
              selected={selectedTimeSlots.includes(index)}
              disabled={disabled}
              onClick={() => toggleSelectedTimeSlot(index)}
              isMiddleOfRange={lowestSelectedIndex < index && index < highestSelectedIndex}
              invalidTarget={checkIfIndexRangeContainsBookedTime(calculateIndexRangeToAdd(index))}
            />
          );
        })}
      </CellContainer>
    </OuterLabelFieldWrapper>
  );
};
