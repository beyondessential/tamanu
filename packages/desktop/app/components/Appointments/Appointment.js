import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import CancelIcon from '@material-ui/icons/Cancel';
import { Colors } from '../../constants';
import { PatientNameDisplay } from '../PatientNameDisplay';

export const Appointment = props => {
  const {
    appointment: { id, startTime, patient, status },
  } = props;

  return (
    <StyledAppointment className={`status-${status}`} data-tip={id} data-for="appointment-details">
      <div>
        <div>
          <PatientNameDisplay patient={patient} />
        </div>
        <div>{moment(startTime).format('h:mm a')}</div>
      </div>
      <div className="icon">
        {status === 'Confirmed' && <RadioButtonUncheckedIcon />}
        {status === 'Arrived' && <CheckCircleIcon />}
        {status === 'No-show' && <CancelIcon />}
      </div>
    </StyledAppointment>
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
