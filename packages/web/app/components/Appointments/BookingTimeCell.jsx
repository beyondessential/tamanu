import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { ConditionalTooltip, ThemedTooltip } from '../Tooltip';
import { TimeRangeDisplay } from '../DateDisplay';

const Cell = styled.div`
  border: 1px solid ${Colors.outline};
  block-size: 1.875rem;
  border-radius: 3.125rem;
  font-size: 0.75rem;
  inline-size: 7.8125rem;
  line-height: 1;
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
  ${({ $inHoverRange }) => $inHoverRange && `background-color: ${Colors.veryLightBlue}`};
  ${({ $selected }) => $selected && `background-color: ${Colors.primary}1A`};
  &:hover {
    cursor: ${({ $selectable }) => ($selectable ? `pointer` : 'cursor')};
  }
`;

const BookedCell = styled(Cell)`
  background-color: ${Colors.alert}1A;
  color: ${Colors.midText};
`;

export const BookingTimeCell = ({
  timeSlot,
  onClick,
  selected,
  booked,
  selectable,
  disabled,
  onMouseEnter,
  onMouseLeave,
  inHoverRange,
}) => {
  if (disabled) {
    return (
      <DisabledCell>
        <TimeRangeDisplay range={timeSlot} />
      </DisabledCell>
    );
  }

  if (booked) {
    return (
      <ThemedTooltip title="Not available">
        <BookedCell>
          <TimeRangeDisplay range={timeSlot} />
        </BookedCell>
      </ThemedTooltip>
    );
  }

  return (
    <ConditionalTooltip
      visible={!selectable}
      // TODO: wont work with translations
      title={
        <>
          All times must be available when <br /> booking over multiple times
        </>
      }
    >
      <AvailableCell
        $inHoverRange={inHoverRange && selectable}
        $selected={selected}
        $selectable={selectable}
        onMouseEnter={selectable ? onMouseEnter : null}
        onMouseLeave={selectable ? onMouseLeave : null}
        onClick={selectable ? onClick : null}
      >
        <TimeRangeDisplay range={timeSlot} />
      </AvailableCell>
    </ConditionalTooltip>
  );
};
