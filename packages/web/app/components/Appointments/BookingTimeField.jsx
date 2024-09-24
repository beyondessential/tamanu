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
      id: i,
      startTime: start,
      endTime: end,
      available: checkIfLocationAvailable(existingLocationBookings, start),
      selected: false,
    });
  }

  return slots;
};

export const BookingTimeField = ({ disabled = false }) => {
  const { getSetting } = useSettings();
  const { setFieldValue, values } = useFormikContext();

  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const earliestSelection = useMemo(() => min(selectedTimeSlots), [selectedTimeSlots]);
  const latestSelection = useMemo(() => max(selectedTimeSlots), [selectedTimeSlots]);

  const { locationId, date } = values;

  const { data: existingLocationBookings, isFetched } = useAppointments({
    after: toDateTimeString(startOfDay(date)),
    before: toDateTimeString(endOfDay(date)),
    all: true,
    locationId,
  });

  const bookingSlotSettings = getSetting('appointments.bookingSlots');

  const timeSlots = useMemo(() => {
    return isFetched ? calculateTimeSlots(bookingSlotSettings, existingLocationBookings.data) : [];
  }, [bookingSlotSettings, existingLocationBookings, isFetched]);

  useEffect(() => {
    setFieldValue('startTime', toDateTimeString(timeSlots[earliestSelection]?.startTime));
    setFieldValue('endTime', toDateTimeString(timeSlots[latestSelection]?.endTime));
  }, [earliestSelection, latestSelection, timeSlots, setFieldValue]);

  const calculateIdsToAdd = id => {
    const idsToAdd = [id];
    const shouldPopulateUp = id > latestSelection;
    const shouldPopulateDown = id < earliestSelection;
    // Autofill any numbers between the ends of current range and new selection
    if (shouldPopulateDown) idsToAdd.push(...range(earliestSelection - 1, id));
    if (shouldPopulateUp) idsToAdd.push(...range(latestSelection + 1, id));
    return idsToAdd;
  };

  const checkIfContainsBookedTime = ids =>
    ids.some(item =>
      timeSlots
        .filter(({ available }) => !available)
        .map(slot => slot.id)
        .includes(item),
    );

  const removeSelectedId = id =>
    setSelectedTimeSlots(prevSelections => prevSelections.filter(selection => selection !== id));
  const addSelectedIds = idsToAdd =>
    setSelectedTimeSlots(prevSelections => [...prevSelections, ...idsToAdd]);

  const toggleSelectedTimeSlot = id => {
    if (selectedTimeSlots.length === 0) return addSelectedIds([id]);
    if (selectedTimeSlots.includes(id)) return removeSelectedId(id);
    return addSelectedIds(calculateIdsToAdd(id));
  };

  return (
    <OuterLabelFieldWrapper label="Booking time" required>
      <CellContainer $disabled={disabled}>
        {timeSlots.map(timeSlot => {
          return (
            <BookingTimeCell
              key={timeSlot.id}
              timeSlot={timeSlot}
              selected={selectedTimeSlots.includes(timeSlot.id)}
              disabled={disabled}
              onClick={() => toggleSelectedTimeSlot(timeSlot.id)}
              isMiddleOfRange={earliestSelection < timeSlot.id && timeSlot.id < latestSelection}
              invalidTarget={checkIfContainsBookedTime(calculateIdsToAdd(timeSlot.id))}
            />
          );
        })}
      </CellContainer>
    </OuterLabelFieldWrapper>
  );
};
