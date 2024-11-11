import Skeleton, { skeletonClasses } from '@mui/material/Skeleton';
import ToggleButton, { toggleButtonClasses } from '@mui/material/ToggleButton';
import { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';
import React from 'react';
import styled, { css } from 'styled-components';

import { Colors } from '../../../../constants';
import { TimeRangeDisplay } from '../../../DateDisplay';
import { ConditionalTooltip, ThemedTooltip } from '../../../Tooltip';
import { TranslatedText } from '../../../Translation/TranslatedText';

/**
 * @privateRemarks Specificity (0,5,0) to override styles (for all states, including :disabled and
 * :hover) that are baked into the MUI component. A more precise selector with equivalent behaviour
 * would be:
 * ```
 * .${toggleButtonGroupClasses.root} &.${toggleButtonClasses.root}.${toggleButtonGroupClasses.grouped}:is(
 *   .${toggleButtonGroupClasses.firstButton},
 *   .${toggleButtonGroupClasses.middleButton},
 *   .${toggleButtonGroupClasses.lastButton}
 * )
 * ```
 */
const Toggle = styled(ToggleButton)`
  &&&&& {
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

      :is(&, & + &) {
        //   ^~~~~ Override another stubborn MUI style
        border: max(0.0625rem, 1px) solid ${Colors.primary};
      }
    }

    // Manually manage hover effect with $hover transient prop
    // Using :where() to avoid :not() increasing specificity
    &:where(:not(.${toggleButtonGroupClasses.selected})):hover {
      background-color: unset;
    }

    &:disabled,
    &[aria-disabled='true'],
    &.${toggleButtonGroupClasses.disabled} {
      background-color: ${Colors.background};
      cursor: not-allowed;
    }

    .MuiTouchRipple-child {
      background-color: oklch(from ${Colors.primary} l c h / 50%);
      @supports not (color: oklch(from black l c h)) {
        background-color: ${Colors.primary}80;
      }
    }
  }
`;

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

const BookedCell = styled(Toggle).attrs({
  'aria-disabled': true, // Not true `disabled` attribute as it prevents tooltip from listening for events
})`
  // (0,6,0) to override styling of disabled Toggle
  &&&&&& {
    color: ${Colors.midText};

    background-color: oklch(from ${Colors.alert} l c h / 10%);
    @supports not (color: oklch(from black l c h)) {
      background-color: ${Colors.alert}1a;
    }
  }
`;

const tooltipStyles = css`
  // Workaround: ThemedTooltip passes its classes onto the tooltip popper
  &:not(.MuiTooltip-popper) {
    display: grid;
    grid-template-columns: subgrid;
  }
`;

const BookedTooltip = styled(ThemedTooltip).attrs({
  title: (
    <TranslatedText stringId="locationBooking.tooltip.notAvailable" fallback="Not available" />
  ),
})`
  ${tooltipStyles}
`;

const StyledConditionalTooltip = styled(ConditionalTooltip).attrs({
  title: (
    <TranslatedText
      stringId="locationBooking.tooltip.unavailableTimeInRangeWarning"
      fallback="All times must be available when booking over multiple times"
    />
  ),
})`
  ${tooltipStyles};
  max-inline-size: 13em;
  text-wrap: balance;
`;

export const TimeSlotToggle = ({
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
      <BookedTooltip>
        <Toggle {...props} $booked aria-disabled>
          {/* Not true `disabled` attribute as it prevents tooltip from listening for events */}
          <TimeRangeDisplay range={timeSlot} />
        </Toggle>
      </BookedTooltip>
    );
  }

  return (
    <StyledConditionalTooltip visible={!selectable}>
      <AvailableCell
        $hover={selectable && inHoverRange}
        $selectable={selectable}
        onMouseEnter={selectable ? onMouseEnter : null}
        onMouseLeave={selectable ? onMouseLeave : null}
        {...props}
      >
        <TimeRangeDisplay range={timeSlot} />
      </AvailableCell>
    </StyledConditionalTooltip>
  );
};

const StyledSkeleton = styled(Skeleton).attrs({ variant: 'rounded' })`
  &.${skeletonClasses.root} {
    block-size: 1.875rem;
    border-radius: calc(infinity * 1px);
  }
`;

export const SkeletonTimeSlotToggles = ({ count = 16 }) => {
  return Array.from({ length: count }).map((_, i) => <StyledSkeleton key={i} />);
};
