import React from 'react';
import styled, { css } from 'styled-components';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { Colors } from '../../constants';
import { APPOINTMENT_STATUS_COLORS } from './statusColors';

const selectedSelector = 'selected';

const Wrapper = styled.div`
  ${props =>
    css`
      --bg-lighter: oklch(from ${props.$color} l c h / 10%);
      --bg-darker: oklch(from ${props.$color} l c h / 20%);
      @supports not (color: oklch(from black l c h)) {
        // These work only with six-digit hex colours
        --bg-lighter: ${props.$color}1a;
        --bg-darker: ${props.$color}33;
      }

      background-color: var(--bg-lighter);
      border-color: ${props.$color};

      &:hover {
        background-color: var(--bg-darker);
      }

      &.${selectedSelector} {
        border-width: 1px;
        background-color: var(--bg-darker);
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

const Timestamp = ({ date }) => (
  <time dateTime={date.toISOString()}>
    {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
  </time>
);

const getPatientFullName = ({ firstName, middleName, lastName }) => {
  const names = [firstName, middleName, lastName].map(n => n ?? '');
  return names.join(' ');
};

export const AppointmentTile = ({
  appointment: { patient, startTime, status: appointmentStatus },
  selected = false,
}) => (
  <Wrapper
    $color={APPOINTMENT_STATUS_COLORS[appointmentStatus] ?? Colors.blue}
    $selected={selected}
  >
    <Label $strikethrough={appointmentStatus === APPOINTMENT_STATUSES.NO_SHOW}>
      <Timestamp date={new Date(startTime)} /> {getPatientFullName(patient)}
    </Label>
  </Wrapper>
);
