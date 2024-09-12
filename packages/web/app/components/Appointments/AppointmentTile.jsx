import React from 'react';
import styled, { css } from 'styled-components';
import { parseISO } from 'date-fns';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { Colors } from '../../constants';
import { APPOINTMENT_STATUS_COLORS } from './appointmentStatusIndicators';
import { AppointmentStatusIcon as StatusIcon } from '../Icons';
import { formatTime } from '../DateDisplay';

const Wrapper = styled.div`
  ${({ $color, $selected }) =>
    css`
      --bg-lighter: oklch(from ${$color} l c h / 10%);
      --bg-darker: oklch(from ${$color} l c h / 20%);
      @supports not (color: oklch(from black l c h)) {
        // These work only with six-digit hex colours
        --bg-lighter: ${$color}1a;
        --bg-darker: ${$color}33;
      }

      border-color: ${$color};

      ${$selected &&
        css`
          border: 1px solid ${$color};
          background-color: var(--bg-darker);
        `}
    `}

  background-color: var(--bg-lighter);
  border-radius: 0.3125rem;
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

  &:hover {
    background-color: var(--bg-darker);
  }
`;

const Label = styled.span`
  padding-inline-start: 0.3125rem;

  ${props =>
    props.$strikethrough &&
    css`
      text-decoration-line: line-through;
    `}
`;

const Timestamp = ({ date }) => <time dateTime={date.toISOString()}>{formatTime(date)}</time>;

const getPatientFullName = ({ firstName, middleName, lastName }) => {
  const names = [firstName, middleName, lastName].map(n => n ?? '');
  return names.join(' ');
};

export const AppointmentTile = ({
  appointment: { patient, startTime, status: appointmentStatus },
  selected = false,
  ...props
}) => (
  <Wrapper
    $color={APPOINTMENT_STATUS_COLORS[appointmentStatus] ?? Colors.blue}
    $selected={selected}
    {...props}
  >
    <Label $strikethrough={appointmentStatus === APPOINTMENT_STATUSES.NO_SHOW}>
      <Timestamp date={parseISO(startTime)} /> {getPatientFullName(patient)}
    </Label>
    <StatusIcon appointmentStatus={appointmentStatus} aria-hidden width={10} height={10} />
  </Wrapper>
);
