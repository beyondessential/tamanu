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

export const BookingTimeField = ({ disabled = false }) => {
  const { getSetting } = useSettings();

  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const removeSelectedTimeSlotId = id =>
    setSelectedTimeSlots(prevSelections =>
      prevSelections.filter(selection => selection !== id).sort((a, b) => a - b),
    );
  const addSelectedTimeSlotIds = idsToAdd =>
    setSelectedTimeSlots(prevSelections => [...prevSelections, ...idsToAdd].sort((a, b) => a - b));

  const earliestSelection = useMemo(() => first(selectedTimeSlots), [selectedTimeSlots]);
  const latestSelection = useMemo(() => last(selectedTimeSlots), [selectedTimeSlots]);

  // TODO: this should take location and date
  const { data: appointmentData } = useAppointments();

  const { startTime, endTime, slotDuration } = getSetting('appointments.bookingSlots');
  const timeSlots = useMemo(() => {
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
        available: checkIfLocationAvailable(appointmentData?.data, start),
        selected: false,
      });
    }

    return slots;
  }, [startTime, endTime, slotDuration, appointmentData]);

  const reservedTimeSlots = timeSlots.filter(({ available }) => !available).map(slot => slot.id);

  const checkIfContainsBookedTime = ids => {
    return ids.some(item => reservedTimeSlots.includes(item));
  };

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
    if (selectedTimeSlots.length === 0) return addSelectedTimeSlotIds([id]);

    const idsToAdd = calculateIdsToAdd(id);
    // Check that the autopopulation hasnt tried to add a booked time
    const isAddingReservedId = checkIfContainsBookedTime(idsToAdd);
    // Cant unselect a time in the middle of the range
    const withinSelectedRange = id < latestSelection && id > earliestSelection;
    // Do nothing if operation not allowed
    if (isAddingReservedId || withinSelectedRange) return;

    if (selectedTimeSlots.includes(id)) {
      removeSelectedTimeSlotId(id);
    } else {
      addSelectedTimeSlotIds(idsToAdd);
    }
  };

  const overallStartTime = timeSlots[earliestSelection]?.startTime;
  const overallEndTime = timeSlots[latestSelection]?.endTime;

  return (
    <>
      {selectedTimeSlots.length > 0 &&
        `Start: ${format(overallStartTime, 'hh:mm a')} End: ${format(overallEndTime, 'hh:mm a')}`}
      <OuterLabelFieldWrapper label="Booking time" required>
        <CellContainer $disabled={disabled}>
          {timeSlots.map(timeSlot => {
            return (
              <BookingTimeCell
                key={timeSlot.id}
                timeSlot={timeSlot}
                selected={selectedTimeSlots.includes(timeSlot.id)}
                onClick={() => toggleSelectedTimeSlot(timeSlot.id)}
                middleOfRange={earliestSelection < timeSlot.id && timeSlot.id < latestSelection}
                invalidTarget={checkIfContainsBookedTime(calculateIdsToAdd(timeSlot.id))}
              />
            );
          })}
        </CellContainer>
      </OuterLabelFieldWrapper>
    </>
  );
};
