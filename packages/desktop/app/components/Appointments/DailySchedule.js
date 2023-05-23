import React from 'react';
import styled from 'styled-components';
import { groupBy } from 'lodash';
import { APPOINTMENT_STATUSES } from 'shared/constants';
import { Colors } from '../../constants';
import { Appointment } from './Appointment';

// If header is longer than 24 characters, split it into two lines
const splitHeaderIfNeeded = header => {
  const findMiddleSpacePosition = string => {
    const middleIndex = Math.floor(string.length / 2);
    let leftIndex = middleIndex;
    let rightIndex = middleIndex;

    while (leftIndex >= 0 || rightIndex < string.length) {
      if (string[leftIndex] === ' ') {
        return leftIndex;
      }
      if (string[rightIndex] === ' ') {
        return rightIndex;
      }

      leftIndex--;
      rightIndex++;
    }

    return -1; // Return -1 if no space is found
  };

  let middleSpacePosition = -1;
  if (header.length > 24) {
    middleSpacePosition = findMiddleSpacePosition(header);
  }
  const headerStrings =
    middleSpacePosition === -1
      ? [header]
      : [header.slice(0, middleSpacePosition), header.slice(middleSpacePosition + 1)];

  return headerStrings;
};

const Column = ({ header, appointments, onAppointmentUpdated }) => {
  const appointmentsByStartTime = [...appointments].sort((a, b) => a.startTime - b.startTime);
  const headerStrings = splitHeaderIfNeeded(header);

  return (
    <>
      <ColumnHeader className="location">
        {headerStrings.map(headerString => (
          <ColumnHeaderLine>{headerString}</ColumnHeaderLine>
        ))}
      </ColumnHeader>
      <ColumnBody className="appointments">
        {appointmentsByStartTime.map(appt => (
          <Appointment key={appt.id} appointment={appt} onUpdated={onAppointmentUpdated} />
        ))}
      </ColumnBody>
    </>
  );
};

export const DailySchedule = ({
  appointments,
  activeFilter,
  filterValue,
  appointmentType,
  onAppointmentUpdated,
}) => {
  const appointmentGroups = groupBy(
    appointments.filter(appointment => {
      // don't show canceled appointment
      if (appointment.status === APPOINTMENT_STATUSES.CANCELLED) {
        return false;
      }
      return true;
    }),
    appt => appt[activeFilter].id,
  );
  const columns = Object.entries(appointmentGroups)
    .filter(([key]) => {
      // currently this just selects a single element from the appointmentGroups object,
      // but we're keeping it as an array filter to allow for easier expansion in future
      if (!filterValue) {
        return true;
      }
      return key === filterValue;
    })
    .map(([key, appts]) => {
      const firstAppointment = appts[0];
      const filterObject = firstAppointment[activeFilter];
      // location has name, while clinician has displayName;
      const header = filterObject.name || filterObject.displayName;

      const displayAppointments = appts.filter(appointment => {
        // if no appointmentType selected, show all
        if (!appointmentType.length) {
          return true;
        }
        return appointmentType.includes(appointment.type);
      });
      return {
        header,
        appointments: displayAppointments,
        key,
      };
    });
  return (
    <Container>
      {columns.map(props => (
        <Column onAppointmentUpdated={onAppointmentUpdated} {...props} />
      ))}
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-rows: max-content 1fr;
  grid-auto-flow: column;
  justify-content: start;
  position: relative;
  width: fit-content;
`;

const ColumnHeader = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${Colors.outline};
  border-right: none;
  font-weight: bold;
  padding: 0.75em 1.5em;
  align-items: center;
  background-color: ${Colors.white};
  position: sticky;
  top: 0;
  text-color: ${Colors.darkText};
  :nth-last-of-type(2) {
    border-right: 1px solid ${Colors.outline};
  }
`;

const ColumnHeaderLine = styled.div`
  text-align: center;
  width: max-content;
`;

const ColumnBody = styled.div`
  border: 1px solid ${Colors.outline};
  border-right: none;
  padding: 0;
  :last-of-type {
    border-right: 1px solid ${Colors.outline};
  }
`;
