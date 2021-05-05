import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { AppointmentsContext } from './AppointmentsContext';
import { HourlyAppointmentBlock } from './HourlyAppointmentBlock';

const LocationColumn = ({ locationName, appointments }) => {
  const appointmentsByStartTime = React.useMemo(
    () =>
      appointments.reduce((acc, appointment) => {
        const startHour = new Date(appointment.startTime).getHours();
        if (!acc[startHour]) {
          acc[startHour] = [];
        }
        acc[startHour].push(appointment);
        return acc;
      }, {}),
    [appointments],
  );
  return (
    <ScheduleColumn>
      <LocationName>{locationName}</LocationName>
      {hours.map(hour => {
        return (
          <HourlyAppointmentBlock
            key={`${locationName} - ${hour.label}`}
            appointments={appointmentsByStartTime[hour.startHour]}
          />
        );
      })}
    </ScheduleColumn>
  );
};

export const DailySchedule = () => {
  const { locations, filteredLocations, appointments } = React.useContext(AppointmentsContext);
  const appointmentsByLocationId = React.useMemo(
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
      <LabelColumn>
        {hours.map(hour => (
          <Label key={hour.label}>{hour.label}</Label>
        ))}
      </LabelColumn>
      {Object.entries(filteredLocations)
        .filter(([, value]) => !!value)
        .map(([locationId]) => {
          const location = locations.find(l => l.id === locationId);
          return (
            <LocationColumn
              key={locationId}
              locationName={location?.name}
              appointments={appointmentsByLocationId[locationId]}
            />
          );
        })}
    </Container>
  );
};

const hours = [
  { startHour: 0, label: '' },
  { startHour: 1, label: '1:00am' },
  { startHour: 2, label: '2:00am' },
  { startHour: 3, label: '3:00am' },
  { startHour: 4, label: '4:00am' },
  { startHour: 5, label: '5:00am' },
  { startHour: 6, label: '6:00am' },
  { startHour: 7, label: '7:00am' },
  { startHour: 8, label: '8:00am' },
  { startHour: 9, label: '9:00am' },
  { startHour: 10, label: '10:00am' },
  { startHour: 11, label: '11:00am' },
  { startHour: 12, label: '12:00pm' },
  { startHour: 13, label: '1:00pm' },
  { startHour: 14, label: '2:00pm' },
  { startHour: 15, label: '3:00pm' },
  { startHour: 16, label: '4:00pm' },
  { startHour: 17, label: '5:00pm' },
  { startHour: 18, label: '6:00pm' },
  { startHour: 19, label: '7:00pm' },
  { startHour: 20, label: '8:00pm' },
  { startHour: 21, label: '9:00pm' },
  { startHour: 22, label: '10:00pm' },
  { startHour: 23, label: '11:00pm' },
];

const Container = styled.div`
  padding: 0 30px;
  display: flex;
  flex-direction: row;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
`;

const LabelColumn = styled(Column)`
  margin-right: 5px;
`;

const ScheduleColumn = styled(Column)`
  border: 1px solid ${Colors.outline};
`;

const Label = styled.div`
  margin: 30px 0 30px 0;
  height: 30px;
`;

const LocationName = styled.div`
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const HalfHourBlock = styled.div`
  background-color: white;
  min-height: 45px;
  width: 200px;
  border-top: 1px solid ${Colors.outline};
`;
