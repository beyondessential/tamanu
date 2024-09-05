import React from 'react';
import styled, { css } from 'styled-components';

import { Colors } from '../../constants';
import { APPOINTMENT_STATUS_COLORS } from './statusColors';

const inactiveSelector = 'inactive';

const PillShape = styled.button`
  ${props =>
    css`
      color: ${props.$hexColor};
      background-color: oklch(from ${props.$hexColor} l c h / 10%);

      @supports not (color: oklch(from black l c h)) {
        background-color: ${props.$hexColor}1a; // Works only with six-digit hex colour
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

  &:disabled,
  &.${inactiveSelector} {
    border: 1px solid ${Colors.softText};
    color: ${Colors.softText};
  }

  &.${inactiveSelector} {
    background-color: ${Colors.white};
  }

  &:disabled {
    background-color: ${Colors.softOutline};
    cursor: not-allowed;
  }
`;

const Token = ({ hexColor = Colors.blue, children, ...props }) => (
  <PillShape $hexColor={hexColor} {...props}>
    {children}
  </PillShape>
);

export const AppointmentStatusToken = ({ className, appointmentStatus, disabled, deselected }) => {
  const classes = deselected ? [className, inactiveSelector].join('') : className;
  return (
    <Token
      className={classes}
      disabled={disabled}
      hexColor={APPOINTMENT_STATUS_COLORS[appointmentStatus]}
      deselected={deselected}
    >
      {appointmentStatus ?? <>&mdash;</>}
    </Token>
  );
};
