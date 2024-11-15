import { PriorityHigh as HighPriorityIcon } from '@material-ui/icons';
import OvernightIcon from '@material-ui/icons/Brightness2';
import { format, isSameDay, parseISO } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { Colors } from '../../constants';
import { UnstyledHtmlButton } from '../Button';
import { getPatientNameAsString } from '../PatientNameDisplay';
import { ThemedTooltip } from '../Tooltip';
import { AppointmentDetailPopper } from './AppointmentDetailPopper';
import {
  APPOINTMENT_STATUS_COLORS,
  AppointmentStatusIndicator as StatusIndicator,
} from './appointmentStatusIndicators';

const Tile = styled(UnstyledHtmlButton)`
  align-items: center;
  background-color: var(--bg-lighter);
  border-color: transparent;
  border-radius: 0.3125rem;
  border-style: solid;
  border-width: max(0.0625rem, 1px);
  color: ${Colors.darkestText};
  cursor: pointer;
  display: grid;
  gap: 0.3125rem;
  grid-template-columns: 1fr auto;
  padding-block: 0.5rem;
  padding-inline: 0.3125rem;
  transition: background-color 150ms ease, border-color 150ms ease;

  &:hover {
    background-color: var(--bg-darker);
  }

  ${({ $color = Colors.blue, $selected }) =>
    css`
      --bg-lighter: oklch(from ${$color} l c h / 10%);
      --bg-darker: oklch(from ${$color} l c h / 20%);
      @supports not (color: oklch(from black l c h)) {
        // These work only with six-digit hex colours
        --bg-lighter: ${$color}1a;
        --bg-darker: ${$color}33;
      }

      ${$selected &&
        css`
          background-color: var(--bg-darker);
          border-color: ${$color};
        `}
    `}
`;

const Time = styled.time`
  margin-inline-end: 0.3em; // Approximates a wordspace
`;

const Timestamp = ({ date }) => (
  <Time dateTime={date.toISOString()}>{format(date, 'h:mmaaa')}</Time>
);

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

const IconGroup = styled.div`
  align-items: center;
  display: flex;
  justify-content: end;
`;

export const AppointmentTile = ({ appointment, hideTime = false, onEdit, onCancel, ...props }) => {
  const {
    patient,
    startTime: startTimeStr,
    endTime: endTimeStr,
    status: appointmentStatus,
    isHighPriority,
  } = appointment;
  const ref = useRef(null);
  const [open, setOpen] = useState();
  const [localStatus, setLocalStatus] = useState(appointmentStatus);

  const location = useLocation();
  useEffect(() => {
    const { appointmentId } = queryString.parse(location.search);
    if (appointmentId && appointmentId === appointment.id) {
      setOpen(true);
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [location.search]);

  const startTime = parseISO(startTimeStr);
  const endTime = parseISO(endTimeStr);

  const isOvernight = appointment.location && !isSameDay(startTime, endTime);

  const tileText = (
    <>
      {!hideTime && <Timestamp date={startTime} />}
      {getPatientNameAsString(patient)}
    </>
  );

  return (
    <>
      <ThemedTooltip title={tileText}>
        <Tile
          $color={APPOINTMENT_STATUS_COLORS[appointmentStatus]}
          $selected={open}
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
        </Tile>
      </ThemedTooltip>
      <AppointmentDetailPopper
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={ref.current}
        appointment={appointment}
        isOvernight={isOvernight}
        onEdit={onEdit}
        onCancel={onCancel}
        onStatusChange={setLocalStatus}
      />
    </>
  );
};
