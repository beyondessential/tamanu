import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import { Colors, PatientColors } from '../../constants';
import { hashStr } from '../../utils';

export const Appointment = props => {
  const {
    appointment: { startTime, user },
  } = props;

  console.log(hashStr)
  console.log(hashStr(user.id));
  const patientColorIndex = hashStr(user.id) % PatientColors.length;

  return (
    <StyledAppointment style={{ 'background-color': PatientColors[patientColorIndex] }}>
      <div>{user.displayName}</div>
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
`;
