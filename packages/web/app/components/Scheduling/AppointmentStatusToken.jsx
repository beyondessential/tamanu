import React from 'react';
import styled, { css } from 'styled-components';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { Colors } from '../../constants';

const inactiveSelector = 'inactive';

const statusColors = {
  [APPOINTMENT_STATUSES.ARRIVED]: Colors.purple,
  [APPOINTMENT_STATUSES.ASSESSED]: Colors.darkOrange,
  [APPOINTMENT_STATUSES.CONFIRMED]: Colors.blue,
  [APPOINTMENT_STATUSES.NO_SHOW]: Colors.pink,
  [APPOINTMENT_STATUSES.SEEN]: Colors.green,
};

const PillShape = styled.button`
  ${props =>
    css`
      color: ${props.$hexColor};
      background-color: ${props.$hexColor}1a; // 10% opacity
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

const Token = ({ hexColor = Colors.blue, inactive, children, ...props }) => (
  <PillShape $hexColor={hexColor} $inactive={inactive} {...props}>
    {children}
  </PillShape>
);

export const AppointmentStatusToken = ({ className, appointmentStatus, disabled, inactive }) => {
  const classes = inactive ? [className, inactiveSelector].join('') : className;
  return (
    <Token
      aria-disabled={disabled}
      className={classes}
      disabled={disabled}
      hexColor={statusColors[appointmentStatus]}
      inactive={inactive}
    >
      {appointmentStatus ?? <>&mdash;</>}
    </Token>
  );
};
