import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { format } from 'date-fns';
import { ConditionalTooltip } from '../Tooltip';

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
  user-select: none;
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

const getTooltipText = (available, selected, middleOfRange, invalidTarget) => {
  if (!available) return 'Not available';
  if (selected && middleOfRange) return 'Cannot unselect from middle of range';
  if (available && invalidTarget)
    return 'All times must be available when booking over multiple times';
};

export const BookingTimeCell = ({ timeSlot, onClick, selected, isMiddleOfRange, invalidTarget }) => {
  const { startTime, endTime, available } = timeSlot;
  const text = `${format(startTime, 'hh:mm a')} - ${format(endTime, 'hh:mm a')}`;

  const DisplayCell = available ? AvailableCell : BookedCell;

  let tooltipText = getTooltipText(available, selected, isMiddleOfRange, invalidTarget);

  const valid = available && !isMiddleOfRange && !invalidTarget

  return (
    <ConditionalTooltip visible={tooltipText} title={tooltipText}>
      <DisplayCell $selected={selected} onClick={valid ? onClick : null}>
        {text}
      </DisplayCell>
    </ConditionalTooltip>
  );
};
