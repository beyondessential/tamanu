import Skeleton, { skeletonClasses } from '@mui/material/Skeleton';
import ToggleButton, { toggleButtonClasses } from '@mui/material/ToggleButton';
import { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';
import { parseISO, startOfToday } from 'date-fns';
import React, { memo } from 'react';
import styled, { css } from 'styled-components';

import { Colors } from '../../../../constants';
import { useBookingSlots } from '../../../../hooks/useBookingSlots';
import { BOOKING_SLOT_TYPES } from '../../../../constants/locationAssignments';
import { TimeRangeDisplay } from '../../../DateDisplay';
import { ConditionalTooltip, ThemedTooltip } from '../../../Tooltip';
import { TranslatedText } from '../../../Translation/TranslatedText';
import { CONFLICT_TOOLTIP_TITLE, TIME_SLOT_PICKER_VARIANTS } from './constants';
import { idOfTimeSlot } from './utils';

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
    transition:
      background-color 100ms ease,
      border-color 100ms ease,
      color 100ms ease;

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
      color: ${Colors.midText};
      background-color: transparent;
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

const AvailableToggle = styled(Toggle)`
  ${({ $hover = false }) =>
    $hover &&
    css`
      &&,
      &&&&&:hover {
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

const BookedToggle = styled(Toggle).attrs({
  disabled: true,
})`
  // (0,6,0) to override styling of disabled Toggle
  &&&&&& {
    background-color: oklch(from ${Colors.alert} l c h / 10%);
    @supports not (color: oklch(from black l c h)) {
      background-color: ${Colors.alert}1a;
    }
  }
`;

const tooltipStyles = css`
  &:has(> :is(:disabled, [aria-disabled='true'], .${toggleButtonGroupClasses.disabled})) {
    cursor: not-allowed;
  }

  // Prevent tooltip’s div from affecting interpretation of justify-self: auto on children.
  // :not() clause is a workaround: ThemedTooltip passes its classes onto the tooltip popper
  &:not(.MuiTooltip-popper) {
    display: grid;
    grid-template-columns: subgrid;
  }
`;

const StyledTooltip = styled(ThemedTooltip).attrs({
  title: (
    <TranslatedText
      stringId="locationBooking.tooltip.notAvailable"
      fallback="Not available"
      data-testid="translatedtext-id2c"
    />
  ),
})`
  ${tooltipStyles}
`;

const TooltipHelper = styled.div.attrs({ tabIndex: 0 })`
  display: contents;
  :focus-visible {
    outline: none;
  }
`;

/**
 * Wrapping in TooltipHelper ensures tooltip can listen for mouse and focus events even if children
 * would otherwise be disabled.
 */
const BookedTooltip = ({ children, ...props }) => (
  <StyledTooltip {...props} data-testid="styledtooltip-7c6e">
    <TooltipHelper data-testid="tooltiphelper-67sf">{children}</TooltipHelper>
  </StyledTooltip>
);

const ConflictTooltip = styled(ConditionalTooltip)`
  ${tooltipStyles};
  max-inline-size: 13em;
  text-wrap: balance;
`;

export const TimeSlotToggle = ({
  booked = false,
  conflictTooltipTitle = CONFLICT_TOOLTIP_TITLE[TIME_SLOT_PICKER_VARIANTS.RANGE],
  disabled = false,
  inHoverRange = false,
  onMouseEnter,
  onMouseLeave,
  selectable = true,
  timeSlot,
  ...props
}) => {
  if (disabled) {
    return (
      <Toggle {...props} disabled data-testid="toggle-lixi">
        <TimeRangeDisplay range={timeSlot} data-testid="timerangedisplay-ufzc" />
      </Toggle>
    );
  }

  if (booked) {
    return (
      <BookedTooltip data-testid="bookedtooltip-887i">
        <BookedToggle {...props} data-testid="bookedtoggle-bvlf">
          <TimeRangeDisplay range={timeSlot} data-testid="timerangedisplay-yr7n" />
        </BookedToggle>
      </BookedTooltip>
    );
  }

  return (
    <ConflictTooltip
      title={conflictTooltipTitle}
      visible={!selectable}
      data-testid="conflicttooltip-zq8q"
    >
      <AvailableToggle
        $hover={selectable && inHoverRange}
        $selectable={selectable}
        disabled={!selectable}
        onMouseEnter={selectable ? onMouseEnter : null}
        onMouseLeave={selectable ? onMouseLeave : null}
        {...props}
        data-testid="availabletoggle-r779"
      >
        <TimeRangeDisplay range={timeSlot} data-testid="timerangedisplay-u02j" />
      </AvailableToggle>
    </ConflictTooltip>
  );
};

const StyledSkeleton = styled(Skeleton).attrs({ variant: 'rounded' })`
  &.${skeletonClasses.root} {
    block-size: 1.875rem;
    border-radius: calc(infinity * 1px);
  }
`;

const SkeletonTimeSlotToggles = ({ count = 16 }) => {
  return Array.from({ length: count }).map((_, i) => (
    <StyledSkeleton key={i} data-testid="styledskeleton-rh16" />
  ));
};

/**
 * @privateRemarks Use of today is arbitrary; we just need a valid date for the time slots to
 * render. The time slots are the same for each day, so this does just fine as a GUI placeholder.
 */
export const PlaceholderTimeSlotToggles = memo(({ type = BOOKING_SLOT_TYPES.BOOKINGS }) => {
  const { isPending, slots } = useBookingSlots(startOfToday(), type);
  if (isPending) return <SkeletonTimeSlotToggles data-testid="skeletontimeslottoggles-9a22" />;
  return slots?.map((slot) => (
    <TimeSlotToggle
      disabled
      key={idOfTimeSlot(slot)}
      timeSlot={slot}
      data-testid={`timeslottoggle-63lw-${parseISO(slot.start)}-${parseISO(slot.end)}`}
    />
  ));
});
