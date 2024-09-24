import React from 'react';
import styled, { css } from 'styled-components';
import { parseISO } from 'date-fns';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';
import { areSameDay } from '@tamanu/shared/utils/dateTime';

import { Colors } from '../../constants';
import { APPOINTMENT_STATUS_COLORS } from './appointmentStatusIndicators';
import {
  AppointmentStatusIcon as StatusIcon,
  CrescentMoonIcon as OvernightIcon,
  ExclamationMarkIcon as HighPriorityIcon,
} from '../Icons';
import { formatTime } from '../DateDisplay';

const Wrapper = styled.div`
  ${({ $color = Colors.blue, $selected }) =>
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

const IconGroup = styled.div`
  align-items: center;
  display: flex;
  gap: 0.125rem;
  justify-content: end;
`;

const getPatientFullName = ({ firstName, middleName, lastName }) => {
  const names = [firstName, middleName, lastName].map(n => n ?? '');
  return names.join(' ');
};

export const AppointmentTile = ({ appointment, selected = false, ...props }) => {
  const {
    patient,
    startTime: startTimeStr,
    endTime: endTimeStr,
    status: appointmentStatus,
  } = appointment;
  const startTime = parseISO(startTimeStr);
  const endTime = parseISO(endTimeStr);
  console.log(appointment);

  const isHighPriority = true; // TODO
  const isOvernight = !areSameDay(startTime, endTime);

  return (
    <Wrapper
      $color={APPOINTMENT_STATUS_COLORS[appointmentStatus]}
      $selected={selected}
      tabIndex={0}
      {...props}
    >
      <Label $strikethrough={appointmentStatus === APPOINTMENT_STATUSES.NO_SHOW}>
        <Timestamp date={startTime} /> {getPatientFullName(patient)}
      </Label>
      <IconGroup>
        {isHighPriority && (
          <HighPriorityIcon
            aria-label="High priority"
            htmlColor={Colors.alert}
            width={10}
            height={10}
          />
        )}
        {isOvernight && (
          <OvernightIcon aria-label="Overnight" htmlColor="#326699" width={10} height={10} />
        )}
        <StatusIcon appointmentStatus={appointmentStatus} width={10} height={10} />
      </IconGroup>
    </Wrapper>
  );
};
