import { alpha } from '@material-ui/core';
import { ToggleButton, toggleButtonClasses, toggleButtonGroupClasses } from '@mui/material';
import React from 'react';
import styled, { css } from 'styled-components';

import { Colors } from '../../../../constants';
import { TimeRangeDisplay } from '../../../DateDisplay';
import { ConditionalTooltip, ThemedTooltip } from '../../../Tooltip';
import { TranslatedText } from '../../../Translation/TranslatedText';

const Cell = styled(ToggleButton)`
  &.${toggleButtonClasses.root}.${toggleButtonGroupClasses.grouped}:is(
    .${toggleButtonGroupClasses.firstButton},
    .${toggleButtonGroupClasses.middleButton},
    .${toggleButtonGroupClasses.lastButton}
  ) {
    block-size: 1.875rem;
    border-radius: calc(infinity * 1px);
    border: max(0.0625rem, 1px) solid ${Colors.outline};
    font-size: 0.75rem;
    font-variant-numeric: lining-nums tabular-nums;
    font-weight: 400;
    line-height: 1;
    margin: 0;
    touch-action: manipulation;
    transition: background-color 100ms ease, border-color 100ms ease;

    &.${toggleButtonClasses.selected} {
      background-color: ${alpha(Colors.primary, 0.1)};

      &,
      & + & // Override stubborn MUI style
      {
        border: max(0.0625rem, 1px) solid ${Colors.primary};
      }
    }

    &:disabled,
    &.${toggleButtonGroupClasses.disabled} {
      background-color: ${Colors.background};
      cursor: not-allowed;
    }

    ${({ $booked }) =>
      $booked &&
      css`
        &:disabled {
          background-color: ${alpha(Colors.alert, 0.1)};
          color: ${Colors.midText};
        }
      `}`;

const AvailableCell = styled(Cell)`
  ${({ $hover }) =>
    $hover &&
    css`
      &:not(${toggleButtonClasses.selected}),
      &:not(${toggleButtonClasses.selected}):hover {
        background-color: ${Colors.veryLightBlue};
      }
    `};

  ${({ $selectable = false }) =>
    $selectable &&
    css`
      &:hover {
        cursor: pointer;
      }
    `}
`;

export const BookingTimeCell = ({
  timeSlot,
  booked,
  selectable = true,
  disabled,
  onMouseEnter,
  onMouseLeave,
  inHoverRange,
  ...props
}) => {
  if (disabled) {
    return (
      <Cell {...props} disabled>
        <TimeRangeDisplay range={timeSlot} />
      </Cell>
    );
  }

  if (booked) {
    return (
      <ThemedTooltip
        title={
          <TranslatedText
            stringId="locationBooking.tooltip.notAvailable"
            fallback="Not available"
          />
        }
      >
        <Cell {...props} $booked disabled>
          <TimeRangeDisplay range={timeSlot} />
        </Cell>
      </ThemedTooltip>
    );
  }

  return (
    <ConditionalTooltip
      visible={!selectable}
      $maxWidth="200px"
      title={
        <TranslatedText
          stringId="locationBooking.tooltip.unavailableTimeInRangeWarning"
          fallback="All times must be available when booking over multiple times"
        />
      }
    >
      <AvailableCell
        $hover={inHoverRange && selectable}
        $selectable={selectable}
        onMouseEnter={selectable ? onMouseEnter : null}
        onMouseLeave={selectable ? onMouseLeave : null}
        // onClick={selectable ? onClick : null}
        {...props}
      >
        <TimeRangeDisplay range={timeSlot} />
      </AvailableCell>
    </ConditionalTooltip>
  );
};
