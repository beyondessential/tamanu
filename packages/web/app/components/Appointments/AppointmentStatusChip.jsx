import React from 'react';
import styled, { css } from 'styled-components';
import ToggleButton, { toggleButtonClasses } from '@mui/material/ToggleButton';
import { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';

import { Colors } from '../../constants/styles';
import { APPOINTMENT_STATUS_COLORS } from './appointmentStatusIndicators';

const Toggle = styled(ToggleButton)`
.${toggleButtonGroupClasses.root} &.${toggleButtonClasses.root}.${
  toggleButtonGroupClasses.grouped
}:is(
    .${toggleButtonGroupClasses.firstButton},
    .${toggleButtonGroupClasses.middleButton},
    .${toggleButtonGroupClasses.lastButton}
  ) {
    appearance: none;
    background-color: ${Colors.white};
    border-color: ${Colors.softText};
    border-radius: calc(infinity * 1px);
    border-style: solid;
    border-width: max(0.0625rem, 1px);
    color: ${Colors.softText};
    cursor: pointer;
    display: initial;
    font-family: inherit;
    font-size: inherit;
    font-style: inherit;
    font-weight: inherit;
    inline-size: fit-content;
    line-height: inherit;
    margin: 0;
    padding: 0;
    text-align: center;
    text-decoration-thickness: from-font;
    text-transform: none;
    touch-action: manipulation;

    &:disabled,
    &.${toggleButtonClasses.disabled} {
      background-color: ${Colors.softOutline};
      border-color: ${Colors.softText};
      color: ${Colors.softText};
      cursor: not-allowed;
    }
  }

  &&&&&& {
    line-height: 1.35;
    min-inline-size: 4.625rem;
    padding-block: 0.35rem;
    padding-inline: 0.6875rem;
    transition:
      background-color 150ms ease,
      border-color 150ms ease;

    .MuiTouchRipple-child,
    &:hover:not(
        .${toggleButtonClasses.selected}, :disabled,
        .${toggleButtonGroupClasses.disabled}
      ) {
      background-color: ${Colors.veryLightBlue};
    }

    &:disabled,
    &.${toggleButtonClasses.disabled} {
      background-color: initial;
    }

    &.${toggleButtonClasses.selected} {
      border-color: transparent;

      ${({ $color }) => css`
        color: ${$color};
        background-color: oklch(from ${$color} l c h / 10%);
        @supports not (color: oklch(from black l c h)) {
          background-color: ${$color}1a; // Works only with six-digit hex colour
        }
      `}
    }
  }
`;

const Chip = ({ color = Colors.blue, children, selected, ...props }) => (
  <Toggle $color={color} $selected={selected} {...props} data-testid="toggle-mzt4">
    {children}
  </Toggle>
);

export const AppointmentStatusChip = ({
  appointmentStatus,
  disabled = false,
  selected,
  ...props
}) => (
  <Chip
    aria-label={appointmentStatus ?? 'Unknown status'}
    color={APPOINTMENT_STATUS_COLORS[appointmentStatus]}
    disabled={disabled}
    role="radio"
    selected={selected}
    {...props}
    data-testid="chip-poiu"
  >
    {appointmentStatus ?? <>&mdash;</>}
  </Chip>
);
