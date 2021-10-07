import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { startOfDay, endOfDay } from 'date-fns';
import { Colors } from '../../constants';
import { Appointment } from './Appointment';
import { useApi } from '../../api';

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

export const DailySchedule = ({ date }) => {
  const api = useApi();
  const [appointments, setAppointments] = useState([]);
  useEffect(() => {
    (async () => {
      const { data } = await api.get(
        `/appointments?after=${encodeURIComponent(
          startOfDay(date).toISOString(),
        )}&before=${encodeURIComponent(endOfDay(date).toISOString())}`,
      );
      setAppointments(data);
    })();
  }, [date]);
  const byLocation = appointments.reduce(
    (locations, appointment) => ({
      ...locations,
      [appointment.locationId]: [...(locations[appointment.locationId] || []), appointment],
    }),
    {},
  );
  return (
    <Container>
      {Object.entries(byLocation).map(([locationId]) => {
        const location = byLocation[locationId][0].location;
        return (
          <Column key={locationId} header={location?.name} appointments={byLocation[locationId]} />
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
  padding: 0.75em 1.5em;
  text-align: center;
  background-color: ${Colors.background};
`;

const ColumnBody = styled.div`
  padding: 0;
`;
