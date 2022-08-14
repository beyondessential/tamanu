import React, { useState } from 'react';
import styled from 'styled-components';
import { withStyles } from '@material-ui/core/styles';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import CancelIcon from '@material-ui/icons/Cancel';
import Tooltip from '@material-ui/core/Tooltip';
import { Colors } from '../../constants';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { AppointmentDetail } from './AppointmentDetail';
import { DateDisplay } from '../DateDisplay';

const StyledTooltip = withStyles(() => ({
  tooltip: {
    backgroundColor: Colors.white,
    color: Colors.darkestText,
    fontSize: '0.9em',
    padding: '0.75em 1em',
    border: `1px solid ${Colors.outline}`,
    maxWidth: 500,
  },
  arrow: {
    color: Colors.outline,
  },
  popper: {
    zIndex: 1200, // make it less than the dialog, which is 1300
  },
}))(Tooltip);

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
        <AppointmentDetail appointment={appointment} onUpdated={onUpdated} onClose={closeDetail} />
      }
    >
      <StyledAppointment
        className={`status-${status}`}
        onClick={() => setDetailOpen(open => !open)}
      >
        <div>
          <div>
            <PatientNameDisplay patient={patient} />
          </div>
          <DateDisplay date={startTime} showDate={false} showTime />
        </div>
        <div className="icon">
          {status === 'Confirmed' && <RadioButtonUncheckedIcon />}
          {status === 'Arrived' && <CheckCircleIcon />}
          {status === 'No-show' && <CancelIcon />}
        </div>
      </StyledAppointment>
    </StyledTooltip>
  );
};

const StyledAppointment = styled.div`
  display: flex;
  justify-content: space-between;
  column-gap: 1rem;
  cursor: pointer;
  padding: 0.5em 0.75em;
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
