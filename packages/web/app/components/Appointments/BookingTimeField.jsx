import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { OuterLabelFieldWrapper } from '../Field';
import { Colors } from '../../constants';
import { addMinutes, parse, format, differenceInMinutes } from 'date-fns';
import ms from 'ms';
import { ConditionalTooltip, ThemedTooltip } from '../Tooltip';
import { Button } from '../Button';

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
  const text = `${startTime} - ${endTime}`;

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

// TODO: should fetch settings directly rather than get supplied
export const BookingTimeField = ({ settings, disabled = false }) => {
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const { startTime, endTime, slotDuration } = settings;

  const timeSlots = useMemo(() => {
    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());
    const duration = ms(slotDuration) / 60000; // In minutes

    const totalSlots = differenceInMinutes(end, start) / duration;
    const slots = [];
    for (let i = 0; i < totalSlots; i++) {
      const current = addMinutes(start, i * duration);
      const next = addMinutes(current, duration);

      slots.push({
        id: i,
        startTime: format(current, 'hh:mm a'),
        endTime: format(next, 'hh:mm a'),
        available: Math.random() < 0.5,
        selected: false,
      });
    }

    return slots;
  }, [startTime, endTime, slotDuration]);

  return (
    <OuterLabelFieldWrapper label="Booking time" required>
      <CellContainer $disabled={disabled}>
        {timeSlots.map((timeSlot, i) => {
          // TODO: bit hacky
          const isSelected = selectedTimeSlots.includes(i);
          const onSelectSlot = () => {
            setSelectedTimeSlots(prevSelections => {
              return isSelected
                ? prevSelections.filter(selection => selection !== i)
                : [...prevSelections, i];
            });
          };

          return (
            <TimeCell
              key={`timeslot-${i}`}
              timeSlot={timeSlot}
              selected={isSelected}
              onClick={onSelectSlot}
            />
          );
        })}
      </CellContainer>
    </OuterLabelFieldWrapper>
  );
};
