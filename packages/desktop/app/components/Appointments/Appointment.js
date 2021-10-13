import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import { Colors } from '../../constants';
import { PatientNameDisplay } from '../PatientNameDisplay';

export const Appointment = props => {
  const {
    appointment: { startTime, patient, status },
  } = props;

  return (
    <StyledAppointment className={`status-${status}`}>
      <div>
        <PatientNameDisplay patient={patient} />
      </div>
      <div>{moment(startTime).format('h:mm a')}</div>
    </StyledAppointment>
  );
};

const StyledAppointment = styled.div`
  padding: 0.5em 0.75em;
  border-bottom: 1px solid ${Colors.outline};
  &:last-child {
    border-bottom: none;
  }
  &.status-Confirmed {
    background-color: #fffae8;
  }
  &.status-Arrived {
    background-color: #ebfff4;
  }
  &.status-No-show {
    background-color: #ffebe8;
  }
`;
