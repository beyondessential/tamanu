import { PriorityHigh as HighPriorityIcon } from '@material-ui/icons';
import OvernightIcon from '@material-ui/icons/Brightness2';
import { format, isSameDay, parseISO } from 'date-fns';
import React, { useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { Colors } from '../../constants';
import { getPatientNameAsString } from '../PatientNameDisplay';
import { AppointmentDetailPopper } from './AppointmentDetailPopper';
import {
  APPOINTMENT_STATUS_COLORS,
  AppointmentStatusIndicator as StatusIndicator,
} from './appointmentStatusIndicators';
import { ThemedTooltip } from '../Tooltip';

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

      border: 1px solid transparent;

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
  grid-template-columns: 1fr auto;
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
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  ${props =>
    props.$strikethrough &&
    css`
      text-decoration-line: line-through;
    `}
`;

const Timestamp = ({ date }) => (
  <time dateTime={date.toISOString()}>{format(date, 'h:mmaaa')}</time>
);

const IconGroup = styled.div`
  align-items: center;
  display: flex;
  justify-content: end;
`;

export const AppointmentTile = ({ appointment, onEdit, ...props }) => {
  const { patient, startTime: startTimeStr, endTime: endTimeStr, appointmentStatus } = appointment;
  const ref = useRef(null);
  const [open, setOpen] = useState();
  const [localStatus, setLocalStatus] = useState(status);

  const startTime = parseISO(startTimeStr);
  const endTime = parseISO(endTimeStr);

  const isHighPriority = false; // TODO
  const isOvernight = appointment.location && !isSameDay(startTime, endTime);

  const tileText = (
    <>
      <Timestamp date={startTime} /> {getPatientNameAsString(patient)}
    </>
  );

  return (
    <ThemedTooltip title={tileText}>
      <Wrapper
        $color={APPOINTMENT_STATUS_COLORS[appointmentStatus]}
        $selected={open}
        tabIndex={0}
        ref={ref}
        onClick={() => setOpen(true)}
        {...props}
      >
        <Label $strikethrough={appointmentStatus === APPOINTMENT_STATUSES.NO_SHOW}>
          {tileText}
        </Label>
        <IconGroup>
          {isHighPriority && (
            <HighPriorityIcon
              aria-label="High priority"
              aria-hidden={undefined}
              htmlColor={Colors.alert}
              style={{ fontSize: 15 }}
            />
          )}
          {isOvernight && (
            <OvernightIcon
              aria-label="Overnight booking"
              aria-hidden={undefined}
              htmlColor="#326699"
              style={{ fontSize: 15 }}
            />
          )}
          <StatusIndicator appointmentStatus={localStatus} width={15} height={15} />
        </IconGroup>
        <AppointmentDetailPopper
          open={open}
          onClose={() => setOpen(false)}
          anchorEl={ref.current}
          appointment={appointment}
          isOvernight={isOvernight}
          onEdit={onEdit}
          onStatusChange={setLocalStatus}
        />
      </Wrapper>
    </ThemedTooltip>
  );
};
