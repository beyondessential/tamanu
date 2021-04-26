import React, { useMemo, useContext } from 'react';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { AppointmentsContext } from './AppointmentsContext';
import { Appointment } from './Appointment';

const Column = ({ header, appointments }) => {
  const appointmentsByStartTime = appointments.slice().sort((a, b) => a.startTime - b.startTime);
  console.log(appointmentsByStartTime)
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

export const DailySchedule = () => {
  const { locations, filteredLocations, appointments } = useContext(AppointmentsContext);
  const appointmentsByLocationId = useMemo(
    () =>
      appointments.reduce((acc, appointment) => {
        if (!acc[appointment.locationId]) {
          acc[appointment.locationId] = [];
        }
        acc[appointment.locationId].push(appointment);
        return acc;
      }, {}),
    [appointments],
  );
  return (
    <Container>
      {Object.entries(filteredLocations)
        .filter(([, value]) => !!value)
        .map(([locationId]) => {
          const location = locations.find(l => l.id === locationId);
          return (
            <Column
              key={locationId}
              header={location?.name}
              appointments={appointmentsByLocationId[locationId]}
            />
          );
        })}
    </Container>
  );
};

const Container = styled.div`
  margin: 0 1.5em;
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
  padding: .75em 1.5em;
  text-align: center;
  background-color: ${Colors.background};
`;

const ColumnBody = styled.div`
  padding: 0;
`;
