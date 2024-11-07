import {
  Skeleton,
  skeletonClasses,
  ToggleButton,
  toggleButtonClasses,
  toggleButtonGroupClasses,
} from '@mui/material';
import React from 'react';
import styled, { css } from 'styled-components';

import { Colors } from '../../../../constants';
import { TimeRangeDisplay } from '../../../DateDisplay';
import { ConditionalTooltip, ThemedTooltip } from '../../../Tooltip';
import { TranslatedText } from '../../../Translation/TranslatedText';

const Toggle = styled(ToggleButton)`
  &.${toggleButtonClasses.root}.${toggleButtonGroupClasses.grouped}:is(
    .${toggleButtonGroupClasses.firstButton},
    .${toggleButtonGroupClasses.middleButton},
    .${toggleButtonGroupClasses.lastButton}
  ) {
    block-size: 1.875rem;
    border-radius: calc(infinity * 1px);
    border: max(0.0625rem, 1px) solid ${Colors.outline};
    color: ${Colors.darkestText};
    font-size: 0.75rem;
    font-variant-numeric: lining-nums tabular-nums;
    font-weight: 400;
    letter-spacing: 0.01em;
    line-height: 1;
    margin: 0;
    padding: 0.25rem;
    text-transform: none;
    touch-action: manipulation;
    transition: background-color 100ms ease, border-color 100ms ease;

    &.${toggleButtonClasses.selected} {
      background-color: oklch(from ${Colors.primary} l c h / 10%);
      @supports not (color: oklch(from black l c h)) {
        background-color: ${Colors.primary}1a;
      }

      &,
      & + & // Override stubborn MUI style
      {
        border: max(0.0625rem, 1px) solid ${Colors.primary};
      }
    }

    // Manually manage hover effect with $hover transient prop
    // Using :where() to avoid :not() increasing specificity
    &:where(:not(.${toggleButtonGroupClasses.selected})):hover {
     background-color: unset;
    }

    &:disabled,
    &.${toggleButtonGroupClasses.disabled} {
      background-color: ${Colors.background};
      cursor: not-allowed;
    }

    ${({ $booked }) =>
      $booked &&
      css`
        &,
        &:hover {
          color: ${Colors.midText};

          background-color: oklch(from ${Colors.alert} l c h / 10%);
          @supports not (color: oklch(from black l c h)) {
            background-color: ${Colors.alert}1a;
          }
        }
      `}`;

const AvailableCell = styled(Toggle)`
  ${({ $hover }) =>
    $hover &&
    css`
      &:not(${toggleButtonClasses.selected}),
      &&&&:not(${toggleButtonClasses.selected}):hover {
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
  booked = false,
  selectable = true,
  disabled = false,
  onMouseEnter,
  onMouseLeave,
  inHoverRange = false,
  ...props
}) => {
  if (disabled) {
    return (
      <Toggle {...props} disabled>
        <TimeRangeDisplay range={timeSlot} />
      </Toggle>
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
        <Toggle {...props} $booked aria-disabled>
          {/* Not true `disabled` attribute as it prevents tooltip from listening for events */}
          <TimeRangeDisplay range={timeSlot} />
        </Toggle>
      </ThemedTooltip>
    );
  }

  return (
    <ConditionalTooltip
      $maxWidth="200px"
      title={
        <TranslatedText
          stringId="locationBooking.tooltip.unavailableTimeInRangeWarning"
          fallback="All times must be available when booking over multiple times"
        />
      }
      visible={!selectable}
    >
      <AvailableCell
        $hover={selectable && inHoverRange}
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

const StyledSkeleton = styled(Skeleton).attrs({ variant: 'rounded' })`
  &.${skeletonClasses.root} {
    block-size: 1.875rem;
    border-radius: calc(infinity * 1px);
  }
`;

export const SkeletonTimeSlotToggles = ({ count = 16 }) => {
  // eslint-disable-next-line react/jsx-key
  return Array.from({ length: count }).map(() => <StyledSkeleton />);
};
