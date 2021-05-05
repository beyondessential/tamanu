import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../constants';

const EmptyBlock = styled.div`
  background-color: white;
  height: 45px;
  width: 200px;
  border-top: 1px solid ${Colors.outline};
`;

const StyledAppointmentDisplay = styled.div`
  flex: 1;
  background-color: ${({ color }) => `${color}40`};
  display: flex;
  align-items: center;
  padding-left: 10px;
  overflow: hidden;
  white-space: nowrap;
`;

const ColorLookup = {
  0: Colors.secondary,
  1: Colors.safe,
  2: Colors.alert,
};

const AppointmentDisplay = ({ appointment, index }) => {
  const color = ColorLookup[index] || Colors.secondary;
  return (
    <StyledAppointmentDisplay color={color}>
      {appointment.user.displayName}
    </StyledAppointmentDisplay>
  );
};

const AppointmentDisplaysContainer = styled.div`
  height: 45px;
  width: 200px;
  display: flex;
  flex-direction: row;
`;

const CollapsedAppointments = styled.div`
  height: 45px;
  width: 200px;
  background-color: ${Colors.primary}40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 10px;
  overflow: hidden;
`;

const HalfHourBlock = ({ appointments }) => {
  if (!appointments || !appointments.length) {
    return <EmptyBlock />;
  }
  if (appointments.length < 4) {
    return (
      <AppointmentDisplaysContainer>
        {appointments.map((a, index) => (
          <AppointmentDisplay key={a.id} index={index} appointment={a} />
        ))}
      </AppointmentDisplaysContainer>
    );
  }
  return <CollapsedAppointments>4+</CollapsedAppointments>;
};

export const HourlyAppointmentBlock = ({ appointments }) => {
  const [firstHalfHour, secondHalfHour] = appointments?.reduce(
    (acc, appointment) => {
      const startMinutes = new Date(appointment.startTime).getMinutes();
      if (startMinutes === 0) {
        acc[0].push(appointment);
      } else {
        acc[1].push(appointment);
      }
      return acc;
    },
    [[], []],
  ) || [[], []];
  if (firstHalfHour.length) {
    console.log({ firstHalfHour });
  }
  return (
    <>
      <HalfHourBlock appointments={firstHalfHour} />
      <HalfHourBlock appointments={secondHalfHour} />
    </>
  );
};
