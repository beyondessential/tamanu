import React, { useState } from 'react';
import styled from 'styled-components';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import CancelIcon from '@material-ui/icons/Cancel';
import Tooltip from '@material-ui/core/Tooltip';
import { Box } from '@material-ui/core';
import { Colors } from '../../constants';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { AppointmentDetail } from './AppointmentDetail';
import { TimeDisplay } from '../DateDisplay';
import { APPOINTMENT_STATUSES } from '@tamanu/constants';

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} data-testid="tooltip-fig9" />
))`
  z-index: 1200; // make it less than the dialog, which is 1300

  .MuiTooltip-tooltip {
    background-color: ${Colors.white};
    color: ${Colors.darkestText};
    font-size: 0.9em;
    padding: 0.75em 1em;
    border: 1px solid ${Colors.outline};
    max-width: 500px;
  }

  .MuiTooltip-arrow {
    color: ${Colors.outline};
  }
`;

const statusIcons = {
  [APPOINTMENT_STATUSES.CONFIRMED]: (
    <RadioButtonUncheckedIcon data-testid="radiobuttonuncheckedicon-1lg3" />
  ),
  [APPOINTMENT_STATUSES.ARRIVED]: <CheckCircleIcon data-testid="checkcircleicon-pngg" />,
  [APPOINTMENT_STATUSES.NO_SHOW]: <CancelIcon data-testid="cancelicon-txb5" />,
};

export const Appointment = ({ appointment, onUpdated }) => {
  const { startTime, patient, status } = appointment;
  const [detailOpen, setDetailOpen] = useState(false);

  const closeDetail = () => setDetailOpen(false);

  return (
    <StyledTooltip
      arrow
      open={detailOpen}
      onClose={closeDetail}
      disableHoverListener
      disableFocusListener
      disableTouchListener
      interactive
      title={
        <AppointmentDetail
          appointment={appointment}
          onUpdated={onUpdated}
          onClose={closeDetail}
          data-testid="appointmentdetail-egpz"
        />
      }
      data-testid="styledtooltip-olng"
    >
      <StyledAppointment
        className={`status-${status}`}
        onClick={() => setDetailOpen((open) => !open)}
        data-testid="styledappointment-ii9x"
      >
        <div>
          <Box paddingTop="2px" data-testid="box-yclc">
            <PatientNameDisplay patient={patient} data-testid="patientnamedisplay-stqd" />
          </Box>
          <TimeDisplay date={startTime} data-testid="timedisplay-klcg" />
        </div>
        <div className="icon">{statusIcons[status]}</div>
      </StyledAppointment>
    </StyledTooltip>
  );
};

const StyledAppointment = styled.div`
  display: flex;
  justify-content: space-between;
  column-gap: 1rem;
  cursor: pointer;
  padding: 10px;
  border-bottom: 1px solid ${Colors.outline};
  &:last-child {
    border-bottom: none;
  }
  &.status-Confirmed {
    background-color: #fffae8;
    .icon {
      color: #f2c327;
    }
  }
  &.status-Arrived {
    background-color: #ebfff4;
    .icon {
      color: ${Colors.safe};
    }
  }
  &.status-No-show {
    background-color: #ffebe8;
    .icon {
      color: ${Colors.alert};
    }
  }
`;
