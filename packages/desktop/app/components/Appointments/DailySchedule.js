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
  }, [appointmentsByStartTime]);
  return (
    <>
      <ColumnHeader className="location">{header}</ColumnHeader>
      <ColumnBody className="appointments">
        {appointmentsByStartTime.map(appt => (
          <Appointment key={appt.id} appointment={appt} />
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
    <>
      <Container>
        {columns.map(props => (
          <Column {...props} />
        ))}
      </Container>
      <TooltipContainer>
        <Tooltip
          id="appointment-details"
          className="appointment-details"
          event="click"
          clickable
          place="right"
          type="light"
          backgroundColor="#fff"
          arrowColor="#fff"
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
      </TooltipContainer>
    </>
  );
};

const TooltipContainer = styled.div`
  .appointment-details {
    z-index: 1101; /* exceed MuiAppBar-root */
  }
  .appointment-details.show {
    opacity: 1;
  }
`;
const Container = styled.div`
  display: grid;
  grid-template-rows: max-content 1fr;
  grid-auto-flow: column;
  justify-content: start;
`;

const ColumnHeader = styled.div`
  border: 1px solid ${Colors.outline};
  border-bottom: none;
  border-right: none;
  font-weight: bold;
  padding: 0.75em 1.5em;
  text-align: center;
  background-color: ${Colors.background};
  :nth-last-of-type(2) {
    border-right: 1px solid ${Colors.outline};
  }
`;

const ColumnBody = styled.div`
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-right: none;
  padding: 0;
  :last-of-type {
    border-right: 1px solid ${Colors.outline};
  }
`;
