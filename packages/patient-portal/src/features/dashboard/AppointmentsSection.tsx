import React from 'react';
import styled from 'styled-components';
import { get } from 'es-toolkit/compat';
import {
  AuthContext,
  DateTimeProvider,
  SettingsContext,
  TranslatedText,
  useDateTime,
} from '@tamanu/ui-components';
import { type Appointment } from '@tamanu/shared/schemas/patientPortal';

import { useTimeZoneQuery } from '@api/queries/useTimeZoneQuery';
import { useUpcomingAppointmentsQuery } from '@api/queries/useUpcomingAppointmentsQuery';
import { Loading, Muted, Panel, Section, SectionTitle } from '@components/layout';
import { useSettings } from '../../contexts';

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

/** Times are shown in the appointment's facility time, as staff see them. */
const AppointmentDateTimeProvider = ({
  facilityId,
  children,
}: {
  facilityId?: string;
  children: React.ReactNode;
}) => {
  const timeZone = useTimeZoneQuery();
  const settings = useSettings(facilityId ?? '');
  if (timeZone.isPending || settings.isLoading) return <Loading />;
  if (!timeZone.data?.primaryTimeZone || settings.isError) {
    return (
      <Muted role="alert">
        <TranslatedText
          stringId="patientPortal.appointments.loadError"
          fallback="This appointment couldn't be shown. Please try again later."
        />
      </Muted>
    );
  }
  return (
    <AuthContext.Provider value={{ primaryTimeZone: timeZone.data.primaryTimeZone }}>
      <SettingsContext.Provider
        value={{ getSetting: (path: string) => get(settings.data, path), settings: settings.data }}
      >
        <DateTimeProvider>{children}</DateTimeProvider>
      </SettingsContext.Provider>
    </AuthContext.Provider>
  );
};

const AppointmentItem = ({ appointment }: { appointment: Appointment }) => {
  const {
    primaryTimeZone,
    facilityTimeZone,
    locale,
    storedDateTimeToEpochMilliseconds,
    formatWeekdayLong,
    formatTime,
  } = useDateTime();
  const start = new Date(storedDateTimeToEpochMilliseconds(appointment.startTime) ?? NaN);
  const formatStart = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, {
      ...options,
      timeZone: facilityTimeZone ?? primaryTimeZone,
    }).format(start);
  const place = [appointment.locationGroup?.name, appointment.locationGroup?.facility?.name]
    .filter(Boolean)
    .join(', ');
  return (
    <AppointmentRow>
      <DateTile>
        <span>{formatStart({ month: 'short' })}</span>
        <strong>{formatStart({ day: 'numeric' })}</strong>
      </DateTile>
      <Details>
        <strong>
          {formatWeekdayLong(appointment.startTime)}, {formatTime(appointment.startTime)}
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
      <AppointmentDateTimeProvider
        key={appointment.id}
        facilityId={appointment.locationGroup?.facility.id}
      >
        <AppointmentItem appointment={appointment} />
      </AppointmentDateTimeProvider>
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
