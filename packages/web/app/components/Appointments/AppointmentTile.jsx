import React, { useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { parseISO } from 'date-fns';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { Colors } from '../../constants';
import { APPOINTMENT_STATUS_COLORS } from './appointmentStatusIndicators';
import { AppointmentStatusIcon as StatusIcon, OvernightIcon } from '../Icons';
import { formatTime } from '../DateDisplay';
import { areSameDay } from '@tamanu/shared/utils/dateTime';
import { AppointmentDetailPopper } from '.';

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

export const AppointmentTile = ({ appointment, ...props }) => {
  const { patient, startTime, endTime, status: appointmentStatus } = appointment;
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

  const handleClose = event => {
    if (ref.current && ref.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  const isOvernight = !areSameDay(parseISO(startTime), parseISO(endTime));

  return (
    <Wrapper
      $color={APPOINTMENT_STATUS_COLORS[appointmentStatus]}
      $selected={open}
      tabIndex={0}
      ref={ref}
      onClick={handleClick}
      {...props}
    >
      <Label $strikethrough={appointmentStatus === APPOINTMENT_STATUSES.NO_SHOW}>
        <Timestamp date={parseISO(startTime)} /> {getPatientFullName(patient)}
      </Label>
      <IconGroup>
        {/* {isHighPriority && <HighPriorityIcon width={10} height={10} />} */}
        {isOvernight && <OvernightIcon width={10} height={10} />}
        <StatusIcon appointmentStatus={appointmentStatus} width={10} height={10} />
      </IconGroup>
      {open && (
        <AppointmentDetailPopper
          open={open}
          handleClose={handleClose}
          anchorEl={ref.current}
          appointment={appointment}
        />
      )}
    </Wrapper>
  );
};
