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
  ${({ $withinHoverRange }) => $withinHoverRange && `background-color: ${Colors.veryLightBlue};`};
  ${({ $selected }) => $selected && `background-color: ${Colors.primary}1A`};
  &:hover {
    cursor: pointer;
  }
`;

const BookedCell = styled(Cell)`
  background-color: ${Colors.alert}1A;
  color: ${Colors.midText};
`;

export const BookingTimeCell = ({
  timeSlot: { start, end },
  onClick,
  selected,
  booked,
  invalidTarget,
  disabled,
  onMouseEnter,
  onMouseLeave,
  withinHoverRange,
}) => {
  const text = `${format(start, 'hh:mm a')} - ${format(end, 'hh:mm a')}`;

  if (disabled) {
    return <DisabledCell>{text}</DisabledCell>;
  }

  if (booked) {
    return (
      <ThemedTooltip title="Not available">
        <BookedCell>{text}</BookedCell>
      </ThemedTooltip>
    );
  }

  return (
    <ConditionalTooltip
      visible={invalidTarget}
      title="All times must be available when booking over multiple times"
    >
      <AvailableCell
        $withinHoverRange={withinHoverRange && !invalidTarget}
        $selected={selected}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={!invalidTarget ? onClick : null}
      >
        {text}
      </AvailableCell>
    </ConditionalTooltip>
  );
};
