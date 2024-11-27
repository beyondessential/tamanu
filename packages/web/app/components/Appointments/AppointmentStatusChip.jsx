import React from 'react';
import styled, { css } from 'styled-components';

import { Colors } from '../../constants';
import { APPOINTMENT_STATUS_COLORS } from './appointmentStatusIndicators';

const PillShapedButton = styled.button`
  background-color: ${Colors.white};
  border-color: ${Colors.softText};
  border-radius: calc(infinity * 1px);
  border-style: solid;
  border-width: max(0.0625rem, 1px);
  color: ${Colors.softText};
  cursor: pointer;
  font-size: 0.6875rem;
  inline-size: fit-content;
  line-height: 1.35;
  min-inline-size: 4.625rem;
  padding-block: 0.35rem;
  padding-inline: 0.6875rem;
  text-align: center;
  touch-action: manipulation;
  transition: background-color 150ms ease, border-color 150ms ease;

  &:disabled {
    background-color: ${Colors.softOutline};
    border-color: ${Colors.softText};
    color: ${Colors.softText};
    cursor: not-allowed;
  }

  ${({ $color, $selected }) =>
    $selected
      ? css`
          &,
          &:disabled {
            border-color: transparent;
            color: ${$color};
            background-color: oklch(from ${$color} l c h / 10%);

            @supports not (color: oklch(from black l c h)) {
              background-color: ${$color}1a; // Works only with six-digit hex colour
            }
          }
        `
      : css`
          &:hover:not(:disabled) {
            background-color: ${Colors.veryLightBlue};
          }
        `}
`;

const Chip = ({ color = Colors.blue, children, selected, ...props }) => (
  <PillShapedButton $color={color} $selected={selected} {...props}>
    {children}
  </PillShapedButton>
);

export const AppointmentStatusChip = ({ appointmentStatus, disabled, selected, ...props }) => {
  return (
    <Chip
      disabled={disabled}
      color={APPOINTMENT_STATUS_COLORS[appointmentStatus]}
      selected={selected}
      {...props}
    >
      {appointmentStatus ?? <>&mdash;</>}
    </Chip>
  );
};
