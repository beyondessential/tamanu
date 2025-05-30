import { PriorityHigh as HighPriorityIcon } from '@material-ui/icons';
import OvernightIcon from '@material-ui/icons/Brightness2';
import { format, isSameDay, parseISO } from 'date-fns';
import queryString from 'query-string';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { Colors } from '../../constants';
import { UnstyledHtmlButton } from '../Button';
import { getPatientNameAsString } from '../PatientNameDisplay';
import { ThemedTooltip } from '../Tooltip';
import { AppointmentDetailPopper } from './AppointmentDetailPopper/AppointmentDetailPopper';
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
  padding-inline: 0.625rem;
  transition:
    background-color 150ms ease,
    border-color 150ms ease;

  &:hover {
    background-color: var(--bg-darker);
  }

  ${({ $color = Colors.blue, $selected = false }) => css`
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
  <Time dateTime={date.toISOString()} data-testid="time-no0k">
    {format(date, 'h:mmaaa')}
  </Time>
);

const Label = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${(props) =>
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

export const AppointmentTile = ({
  appointment,
  hideTime = false,
  onEdit,
  onCancel,
  actions,
  testIdPrefix,
  allowViewDetail = true,
  ...props
}) => {
  const {
    patient,
    startTime: startTimeStr,
    endTime: endTimeStr,
    status,
    isHighPriority,
  } = appointment;
  const ref = useRef(null);
  const [open, setOpen] = useState();

  const location = useLocation();
  useEffect(() => {
    const { appointmentId } = queryString.parse(location.search);
    if (appointmentId && appointmentId === appointment.id && !hideTime) {
      setTimeout(() => {
        setOpen(true);
        ref.current.scrollIntoView({ block: 'center', inline: 'center' });
      });
    }
  }, [appointment.id, hideTime, location.search]);

  const startTime = parseISO(startTimeStr);
  const endTime = endTimeStr && parseISO(endTimeStr);

  const isLocationBooking = !!appointment.location;
  const isOvernightLocationBooking = isLocationBooking && !isSameDay(startTime, endTime);

  const tileText = (
    <>
      {!hideTime && <Timestamp date={startTime} data-testid="timestamp-icgz" />}
      {getPatientNameAsString(patient)}
    </>
  );

  return (
    <>
      <ThemedTooltip title={tileText} data-testid={`themedtooltip-xoyb-${testIdPrefix}`}>
        <Tile
          $color={APPOINTMENT_STATUS_COLORS[status]}
          $selected={open}
          ref={ref}
          onClick={() => allowViewDetail && setOpen(true)}
          {...props}
          data-testid={`tile-owfj-${testIdPrefix}`}
        >
          <Label
            $strikethrough={status === APPOINTMENT_STATUSES.NO_SHOW}
            data-testid={`label-u6qm-${testIdPrefix}`}
          >
            {tileText}
          </Label>
          <IconGroup data-testid={`icongroup-78rn-${testIdPrefix}`}>
            {isHighPriority && (
              <HighPriorityIcon
                aria-label="High priority"
                aria-hidden={undefined}
                htmlColor={Colors.alert}
                style={{ fontSize: 15 }}
                data-testid={`highpriorityicon-c3ug-${testIdPrefix}`}
              />
            )}
            {isOvernightLocationBooking && (
              <OvernightIcon
                aria-label="Overnight booking"
                aria-hidden={undefined}
                htmlColor={Colors.primary}
                style={{ fontSize: 15 }}
                data-testid={`overnighticon-wbfe-${testIdPrefix}`}
              />
            )}
            <StatusIndicator
              appointmentStatus={status}
              width={15}
              height={15}
              data-testid={`statusindicator-4cq0-${testIdPrefix}`}
            />
          </IconGroup>
        </Tile>
      </ThemedTooltip>
      <AppointmentDetailPopper
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={ref.current}
        appointment={appointment}
        isOvernight={isOvernightLocationBooking}
        onEdit={onEdit}
        onCancel={onCancel}
        actions={actions}
        // px conversions of height / width from CarouselComponents
        preventOverflowPadding={isLocationBooking && { top: 64, left: 184 }}
        data-testid={`appointmentdetailpopper-b4ww-${testIdPrefix}`}
      />
    </>
  );
};
