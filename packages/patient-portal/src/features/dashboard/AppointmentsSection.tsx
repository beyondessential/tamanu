import React from 'react';
import styled from 'styled-components';
import { parseISO } from 'date-fns';
import { TranslatedText } from '@tamanu/ui-components';
import { type Appointment } from '@tamanu/shared/schemas/patientPortal';

import { useUpcomingAppointmentsQuery } from '@api/queries/useUpcomingAppointmentsQuery';
import { Loading, Muted, Panel, Section, SectionTitle } from '@components/layout';

const locale = globalThis.navigator?.language ?? 'default';
const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'short' });
const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'long' });
const timeFormatter = new Intl.DateTimeFormat(locale, { timeStyle: 'short' });

const AppointmentRow = styled.div`
  display: flex;
  gap: 14px;
  padding: 14px 16px;

  & + & {
    border-top: 1px solid var(--pf-line);
  }
`;

/** A calendar leaf, so the date can be read at a glance. */
const DateTile = styled.div`
  flex: none;
  align-self: flex-start;
  width: 52px;
  padding: 6px 0;
  border-radius: 10px;
  background: var(--pf-primary-tint);
  color: var(--pf-heading);
  text-align: center;
  line-height: 1.1;

  span {
    display: block;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
  }

  strong {
    display: block;
    font-size: 22px;
    font-weight: 500;
  }
`;

const Details = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
  color: var(--pf-text-secondary);

  strong {
    font-size: 16px;
    font-weight: 500;
    color: var(--pf-text);
  }
`;

const AppointmentItem = ({ appointment }: { appointment: Appointment }) => {
  const start = parseISO(appointment.startTime);
  const place = [appointment.locationGroup?.name, appointment.locationGroup?.facility?.name]
    .filter(Boolean)
    .join(', ');
  return (
    <AppointmentRow>
      <DateTile>
        <span>{monthFormatter.format(start)}</span>
        <strong>{start.getDate()}</strong>
      </DateTile>
      <Details>
        <strong>
          {dayFormatter.format(start)}, {timeFormatter.format(start)}
        </strong>
        {appointment.appointmentType?.name && <span>{appointment.appointmentType.name}</span>}
        {appointment.clinician?.displayName && <span>{appointment.clinician.displayName}</span>}
        {place && <span>{place}</span>}
      </Details>
    </AppointmentRow>
  );
};

export const AppointmentsSection = () => {
  const { data: appointments, isLoading } = useUpcomingAppointmentsQuery();

  const renderAppointments = () => {
    if (isLoading) return <Loading />;
    if (!appointments?.length) {
      return (
        <Muted>
          <TranslatedText
            stringId="patientPortal.appointments.none"
            fallback="No upcoming appointments"
          />
        </Muted>
      );
    }
    return appointments.map(appointment => (
      <AppointmentItem key={appointment.id} appointment={appointment} />
    ));
  };

  return (
    <Section aria-labelledby="appointments-title">
      <SectionTitle id="appointments-title">
        <TranslatedText
          stringId="patientPortal.appointments.title"
          fallback="Upcoming appointments"
        />
      </SectionTitle>
      <Panel>{renderAppointments()}</Panel>
    </Section>
  );
};
