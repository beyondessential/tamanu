import React, { useEffect } from 'react';
import styled from 'styled-components';
import { groupBy } from 'lodash';
import Tooltip from 'react-tooltip';
import { APPOINTMENT_STATUSES } from 'shared/constants';
import { Colors } from '../../constants';
import { Appointment } from './Appointment';
import { AppointmentDetail } from './AppointmentDetail';

const Column = ({ header, appointments }) => {
  const appointmentsByStartTime = [...appointments].sort((a, b) => a.startTime - b.startTime);
  useEffect(() => {
    Tooltip.rebuild();
  }, []);
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
  appointments,
  activeFilter,
  filterValue,
  appointmentType,
  appointmentUpdated,
}) => {
  const appointmentGroups = groupBy(
    appointments.filter(appointment => {
      // don't show canceled appointment
      if (appointment.status === APPOINTMENT_STATUSES.CANCELLED) {
        return false;
      }
      return true;
    }),
    appt => appt[activeFilter.name].id,
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
      const filterObject = firstAppointment[activeFilter.name];
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
        <Column {...props} />
      ))}
      <Tooltip
        id="appointment-details"
        event="click"
        clickable
        place="right"
        type="light"
        backgroundColor="#fff"
        arrowColor="#fff"
        className="appointment-details"
        border
        borderColor={Colors.outline}
        getContent={appointmentId => {
          if (!appointmentId) {
            return null;
          }
          const appointment = appointments.find(appt => appt.id === appointmentId);
          if (!appointment) {
            return null;
          }
          return <AppointmentDetail appointment={appointment} updated={appointmentUpdated} />;
        }}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  border: 1px solid ${Colors.outline};
  width: fit-content;
  .appointment-details {
    z-index: 1101; /* exceed MuiAppBar-root */
  }
  .appointment-details.show {
    opacity: 1;
  }
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
