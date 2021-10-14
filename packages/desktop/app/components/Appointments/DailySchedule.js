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

export const DailySchedule = ({ appointments, activeFilter }) => (
  <Container>
    {Object.entries(appointments).map(([filterValue, filteredAppointments]) => {
      const firstAppointment = filteredAppointments[0];
      const filterObject = firstAppointment[activeFilter];
      // location has name, while clinician has displayName;
      const title = filterObject.name || filterObject.displayName;
      return <Column key={filterValue} header={title} appointments={filteredAppointments} />;
    })}
  </Container>
);

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
