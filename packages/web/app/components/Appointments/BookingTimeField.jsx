import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { OuterLabelFieldWrapper } from '../Field';
import { Colors } from '../../constants';
import { addMinutes, parse, format, differenceInMinutes } from 'date-fns';
import ms from 'ms';
import { useSettings } from '../../contexts/Settings';
import { first, last, range } from 'lodash';
import { useAppointments } from '../../api/queries/useAppointments';
import { BookingTimeCell } from './BookingTimeCell';

// TODO: disabled logic
const CellContainer = styled.div`
  border: 1px solid ${Colors.outline};
  background-color: ${({ $disabled }) => ($disabled ? 'initial' : 'white')};
  width: 300px;
  padding: 11px 14px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const checkIfLocationAvailable = (appointments, startTime) => {
  return !appointments.some(appointment => {
    const apppontmentStartMs = new Date(appointment.startTime).getTime();
    const apppontmentEndMs = new Date(appointment.endTime).getTime();
    const slotStartMs = startTime.getTime();
    return apppontmentStartMs <= slotStartMs && slotStartMs < apppontmentEndMs;
  });
};

const calculateTimeSlots = (startTime, endTime, slotDuration, appointments) => {
  const startOfDay = parse(startTime, 'HH:mm', new Date());
  const endOfDay = parse(endTime, 'HH:mm', new Date());
  const duration = ms(slotDuration) / 60000; // In minutes

  const totalSlots = differenceInMinutes(endOfDay, startOfDay) / duration;
  const slots = [];
  for (let i = 0; i < totalSlots; i++) {
    const start = addMinutes(startOfDay, i * duration);
    const end = addMinutes(start, duration);

    slots.push({
      id: i,
      startTime: start,
      endTime: end,
      available: checkIfLocationAvailable(appointments, start),
      selected: false,
    });
  }

  return slots;
};

export const BookingTimeField = ({ disabled = false }) => {
  const { getSetting } = useSettings();

  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const removeSelectedId = id =>
    setSelectedTimeSlots(prevSelections =>
      prevSelections.filter(selection => selection !== id).sort((a, b) => a - b),
    );
  const addSelectedIds = idsToAdd =>
    setSelectedTimeSlots(prevSelections => [...prevSelections, ...idsToAdd].sort((a, b) => a - b));

  const earliestSelection = useMemo(() => first(selectedTimeSlots), [selectedTimeSlots]);
  const latestSelection = useMemo(() => last(selectedTimeSlots), [selectedTimeSlots]);

  // TODO: this should take location and date
  const { data: appointmentData } = useAppointments();
  const { startTime, endTime, slotDuration } = getSetting('appointments.bookingSlots');
  const timeSlots = useMemo(
    () => calculateTimeSlots(startTime, endTime, slotDuration, appointmentData?.data),
    [startTime, endTime, slotDuration, appointmentData],
  );

  const checkIfContainsBookedTime = ids =>
    ids.some(item =>
      timeSlots
        .filter(({ available }) => !available)
        .map(slot => slot.id)
        .includes(item),
    );

  const calculateIdsToAdd = id => {
    const idsToAdd = [id];
    const shouldPopulateUp = id > latestSelection;
    const shouldPopulateDown = id < earliestSelection;
    // Autofill any numbers between the ends of current range and new selection
    if (shouldPopulateDown) idsToAdd.push(...range(earliestSelection - 1, id));
    if (shouldPopulateUp) idsToAdd.push(...range(latestSelection + 1, id));
    return idsToAdd;
  };

  const toggleSelectedTimeSlot = id => {
    if (selectedTimeSlots.length === 0) return addSelectedIds([id]);
    if (selectedTimeSlots.includes(id)) return removeSelectedId(id);
    return addSelectedIds(calculateIdsToAdd(id));
  };

  return (
    <>
      <OuterLabelFieldWrapper label="Booking time" required>
        <CellContainer $disabled={disabled}>
          {timeSlots.map(timeSlot => {
            return (
              <BookingTimeCell
                key={timeSlot.id}
                timeSlot={timeSlot}
                selected={selectedTimeSlots.includes(timeSlot.id)}
                onClick={() => toggleSelectedTimeSlot(timeSlot.id)}
                isMiddleOfRange={earliestSelection < timeSlot.id && timeSlot.id < latestSelection}
                invalidTarget={checkIfContainsBookedTime(calculateIdsToAdd(timeSlot.id))}
              />
            );
          })}
        </CellContainer>
      </OuterLabelFieldWrapper>
    </>
  );
};
