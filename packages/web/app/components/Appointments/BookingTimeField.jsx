import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { OuterLabelFieldWrapper } from '../Field';
import { Colors } from '../../constants';
import { addMinutes, parse, format, differenceInMinutes, startOfDay, endOfDay } from 'date-fns';
import ms from 'ms';
import { ConditionalTooltip, ThemedTooltip } from '../Tooltip';
import { Button } from '../Button';
import { useSettings } from '../../contexts/Settings';
import { times, uniqueId } from 'lodash';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useApi } from '../../api';
import { useAppointments } from '../../api/queries/useAppointments';

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

const Cell = styled.div`
  border: 1px solid ${({ $selected }) => ($selected ? Colors.primary : Colors.outline)};
  background-color: ${({ $selected }) => ($selected ? `${Colors.primary}1A` : 'white')};
  height: 30px;
  width: 125px;
  border-radius: 50px;
  font-size: 12px;
  line-height: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const AvailableCell = styled(Cell)`
  &:hover {
    cursor: pointer;
    background-color: ${Colors.veryLightBlue};
  }
`;

const BookedCell = styled(Cell)`
  background-color: ${Colors.alert}1A;
  color: ${Colors.midText};
`;

const TimeCell = ({ timeSlot, onClick, selected }) => {
  const { startTime, endTime, available } = timeSlot;
  const text = `${format(startTime, 'hh:mm a')} - ${format(endTime, 'hh:mm a')}`;

  if (!available)
    return (
      <ThemedTooltip arrow placement="top" title="Not available">
        <BookedCell>{text}</BookedCell>
      </ThemedTooltip>
    );

  return (
    <AvailableCell $selected={selected} onClick={onClick}>
      {text}
    </AvailableCell>
  );
};

export const BookingTimeField = ({ disabled = false, date }) => {
  const { getSetting } = useSettings();
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null);
  // TODO: remove defaults here and use proper state storybook wrapper
  const { startTime, endTime, slotDuration } = getSetting('appointments.bookingSlots');

  const { data: appointmentData } = useAppointments();

  const timeSlots = useMemo(() => {
    const startOfDay = parse(startTime, 'HH:mm', new Date());
    const endOfDay = parse(endTime, 'HH:mm', new Date());
    const duration = ms(slotDuration) / 60000; // In minutes

    const totalSlots = differenceInMinutes(endOfDay, startOfDay) / duration;
    const slots = [];
    for (let i = 0; i < totalSlots; i++) {
      const start = addMinutes(startOfDay, i * duration);
      const end = addMinutes(start, duration);

      // TODO: needs to handle wide range of appointments
      const isAppointmentBooked = appointmentData?.data.some(
        appointment => appointment.startTime === toDateTimeString(start),
      );

      slots.push({
        id: uniqueId('timeslot-'),
        startTime: start,
        endTime: end,
        available: !isAppointmentBooked,
        selected: false,
      });
    }

    return slots;
  }, [startTime, endTime, slotDuration, appointmentData]);

  // TODO: feels a bit hacky
  const toggleSelectedTimeSlot = id => {
    setSelectedTimeSlots(prevSelections => {
      return prevSelections.includes(id)
        ? prevSelections.filter(selection => selection !== id)
        : [...prevSelections, id];
    });
  };

  return (
    <>
      <OuterLabelFieldWrapper label="Booking time" required>
        <CellContainer $disabled={disabled}>
          {timeSlots.map(timeSlot => (
            <TimeCell
              key={timeSlot.id}
              timeSlot={timeSlot}
              selected={selectedTimeSlots.includes(timeSlot.id)}
              onClick={() => toggleSelectedTimeSlot(timeSlot.id)}
            />
          ))}
        </CellContainer>
      </OuterLabelFieldWrapper>
    </>
  );
};
