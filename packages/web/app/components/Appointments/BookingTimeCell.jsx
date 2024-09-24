import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { format } from 'date-fns';
import { ConditionalTooltip, ThemedTooltip } from '../Tooltip';

const Cell = styled.div`
  border: 1px solid ${Colors.outline};
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

const DisabledCell = styled(Cell)`
  background-color: ${Colors.background};
`;

const AvailableCell = styled(Cell)`
  ${({ $selected }) => $selected && `border: 1px solid ${Colors.primary}`};
  ${({ $selected }) => $selected && `background-color: ${Colors.primary}1A`};
  &:hover {
    cursor: pointer;
    background-color: ${Colors.veryLightBlue};
  }
`;

const BookedCell = styled(Cell)`
  background-color: ${Colors.alert}1A;
  color: ${Colors.midText};
`;

export const BookingTimeCell = ({
  timeSlot: { startTime, endTime, available },
  onClick,
  selected,
  isMiddleOfRange,
  invalidTarget,
  disabled,
}) => {
  const text = `${format(startTime, 'hh:mm a')} - ${format(endTime, 'hh:mm a')}`;

  if (disabled) {
    return <DisabledCell>{text}</DisabledCell>;
  }

  if (!available) {
    return (
      <ThemedTooltip title="Not available">
        <BookedCell>{text}</BookedCell>
      </ThemedTooltip>
    );
  }

  let tooltipText;
  if (isMiddleOfRange) tooltipText = 'Cannot unselect from middle of range';
  if (invalidTarget) tooltipText = 'All times must be available when booking over multiple times';
  const validTarget = !isMiddleOfRange && !invalidTarget;

  return (
    <ConditionalTooltip visible={!validTarget} title={tooltipText}>
      <AvailableCell $selected={selected} onClick={validTarget ? onClick : null}>
        {text}
      </AvailableCell>
    </ConditionalTooltip>
  );
};
