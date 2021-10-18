import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { Appointment } from './Appointment';

const Column = ({ header, appointments }) => {
  const appointmentsByStartTime = [...appointments].sort((a, b) => a.startTime - b.startTime);
  return (
    <StyledColumn>
      <ColumnHeader>{header}</ColumnHeader>
      <ColumnBody>
        {appointmentsByStartTime.map(appt => (
          <Appointment key={appt.id} appointment={appt} />
        ))}
      </ColumnBody>
    </StyledColumn>
  );
};

export const DailySchedule = ({
  appointmentGroups,
  activeFilter,
  filterValue,
  appointmentType,
}) => {
  const columns = Object.entries(appointmentGroups)
    .filter(([value]) => {
      if (!filterValue) {
        return true;
      }
      return value === filterValue;
    })
    .map(([value, appointments]) => {
      const firstAppointment = appointments[0];
      const filterObject = firstAppointment[activeFilter];
      const displayAppointments = appointments.filter(appointment => {
        if (!appointmentType.length) {
          return true;
        }
        return appointmentType.includes(appointment.type);
      });
      // location has name, while clinician has displayName;
      const header = filterObject.name || filterObject.displayName;
      return {
        header,
        appointments: displayAppointments,
        key: value,
      };
    });
  return (
    <Container>
      {columns.map(props => (
        <Column {...props} />
      ))}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  border: 1px solid ${Colors.outline};
  width: fit-content;
`;

const StyledColumn = styled.div`
  background-color: ${Colors.white};
  border-right: 1px solid ${Colors.outline};
  &:last-child {
    border-right: none;
  }
`;

const ColumnHeader = styled.div`
  font-weight: bold;
  padding: 0.75em 1.5em;
  text-align: center;
  background-color: ${Colors.background};
`;

const ColumnBody = styled.div`
  padding: 0;
`;
