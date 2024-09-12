import React from 'react';
import styled, { css } from 'styled-components';

import { Colors } from '../../constants';
import { APPOINTMENT_STATUS_COLORS } from './appointmentStatusIndicators';

const PillShapedButton = styled.button`
  ${({ $color }) =>
    css`
      color: ${$color};
      background-color: oklch(from ${$color} l c h / 10%);

      @supports not (color: oklch(from black l c h)) {
        background-color: ${$color}1a; // Works only with six-digit hex colour
      }
    `}

  border-radius: calc(infinity * 1px);
  border: 0;
  cursor: pointer;
  font-size: 0.6875rem;
  inline-size: fit-content;
  line-height: 1.35;
  min-inline-size: 4.625rem;
  padding-block: 0.35rem;
  padding-inline: 0.6875rem;
  text-align: center;
  touch-action: manipulation;
  transition: background-color 150ms ease;

  &:hover:not(:disabled) {
    background-color: ${Colors.veryLightBlue};
  }

  ${({ $deselected }) =>
    $deselected &&
    css`
      border: 1px solid ${Colors.softText};
      color: ${Colors.softText};
      background-color: ${Colors.white};
    `}

  &:disabled {
    border: 1px solid ${Colors.softText};
    color: ${Colors.softText};
    background-color: ${Colors.softOutline};
    cursor: not-allowed;
  }
`;

const Chip = ({ color = Colors.blue, children, deselected, ...props }) => (
  <PillShapedButton $color={color} $deselected={deselected} {...props}>
    {children}
  </PillShapedButton>
);

export const AppointmentStatusChip = ({ appointmentStatus, disabled, deselected, ...props }) => {
  return (
    <Chip
      disabled={disabled}
      color={APPOINTMENT_STATUS_COLORS[appointmentStatus]}
      deselected={deselected}
      {...props}
    >
      {appointmentStatus ?? <>&mdash;</>}
    </Chip>
  );
};
