import React from 'react';
import styled, { css } from 'styled-components';
import { toggleButtonClasses } from '@mui/material/ToggleButton';
import { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';

import { Colors } from '../../constants';
import { APPOINTMENT_STATUS_COLORS } from './appointmentStatusIndicators';
import { ToggleButton } from '../Button';

const Toggle = styled(ToggleButton)`
  &&&&&& {
    line-height: 1.35;
    min-inline-size: 4.625rem;
    padding-block: 0.35rem;
    padding-inline: 0.6875rem;
    transition: background-color 150ms ease, border-color 150ms ease;

    .MuiTouchRipple-child,
    &:hover:not(.${toggleButtonClasses.selected},
        :disabled, .${toggleButtonGroupClasses.disabled}) {
      background-color: ${Colors.veryLightBlue};
    }

    &.${toggleButtonClasses.selected} {
      border-color: transparent;

      ${({ $color }) =>
        css`
          color: ${$color};
          background-color: oklch(from ${$color} l c h / 10%);
          @supports not (color: oklch(from black l c h)) {
            background-color: ${$color}1a; // Works only with six-digit hex colour
          }
        `}
    }
    &:disabled,
    &.${toggleButtonClasses.disabled} {
      background-color: initial;
    }
  }
`;

const Chip = ({ color = Colors.blue, children, selected, ...props }) => (
  <Toggle $color={color} $selected={selected} {...props}>
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
  >
    {appointmentStatus ?? <>&mdash;</>}
  </Chip>
);
