import React from 'react';
import styled from 'styled-components';
import { groupBy } from 'lodash';
import { APPOINTMENT_STATUSES } from '@tamanu/shared/constants';
import { Colors } from '../../constants';
import { Appointment } from './Appointment';

const Column = ({ header, appointments, onAppointmentUpdated }) => {
  const appointmentsByStartTime = [...appointments].sort((a, b) => a.startTime - b.startTime);
  // If header's length is larger than 14 characters, split it into two lines. Width expands if needed.
  const hasSpace = header.includes(' ');
  let width = '100%';
  let minWidth = null;
  if (header.length > 14 && hasSpace) {
    width = `${(header.length * 15) / 2}px`; // shrink width to make text becomes two lines
    minWidth = '100%'; // expand width if it is smaller than the appointment content below it
  }

  return (
    <>
      <ColumnHeader className="location" $width={width} $minWidth={minWidth}>
        {header}
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  width: ${({ $width }) => $width};
  min-width: ${({ $minWidth }) => $minWidth};
  border: 1px solid ${Colors.outline};
  border-right: none;
  font-weight: bold;
  padding: 0.75em 1.5em;
  text-align: center;
  background-color: ${Colors.white};
  position: sticky;
  top: 0;
  text-color: ${Colors.darkText};
  :nth-last-of-type(2) {
    border-right: 1px solid ${Colors.outline};
  }
`;

const ColumnBody = styled.div`
  border: 1px solid ${Colors.outline};
  border-right: none;
  padding: 0;
  :last-of-type {
    border-right: 1px solid ${Colors.outline};
  }
`;
