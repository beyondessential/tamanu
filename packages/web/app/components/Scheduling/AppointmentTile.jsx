import React from 'react';
import styled, { css } from 'styled-components';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { Colors } from '../../constants';
import { APPOINTMENT_STATUS_COLORS } from './statusColors';

const Wrapper = styled.div`
  ${props =>
    css`
      background-color: ${props.$hexColor}1a; // 10% opacity
      border-color: ${props.$hexColor};
      border-width: ${props.$selected ? '1px' : '0'};

      &:hover {
        background-color: ${props.$hexColor}33; // 20% opacity
      }
    `}

  border-radius: 0.3125rem;
  border-style: solid;
  color: ${Colors.darkestText};
  cursor: pointer;
  display: grid;
  gap: 0.3125rem;
  grid-template-columns: 1fr 0.625rem;
  padding-block: 0.5rem;
  padding-inline: 0.3125rem;
  text-decoration-thickness: from-font;
  transition: background-color 150ms ease;
  touch-action: manipulation;
`;

const Label = styled.span`
  padding-inline-start: 0.3125rem;

  ${props =>
    props.$strikethrough &&
    css`
      text-decoration-line: line-through;
    `}
`;

export const AppointmentTile = ({
  appointment: { appointmentStatus, startTime, patient },
  selected = false,
}) => (
  <Wrapper
    $hexColor={APPOINTMENT_STATUS_COLORS[appointmentStatus] ?? Colors.blue}
    $selected={selected}
  >
    <Label $strikethrough={appointmentStatus === APPOINTMENT_STATUSES.NO_SHOW}>
      <time dateTime={startTime.toISOString()}>
        {startTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </time>
      {patient}
    </Label>
  </Wrapper>
);
