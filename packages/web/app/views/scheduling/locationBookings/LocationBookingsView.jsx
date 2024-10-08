import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isThisMonth,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { useLocationBookingsQuery, useLocationsQuery } from '../../../api/queries';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { Colors } from '../../../constants';
import { PageContainer, TopBar, TranslatedText } from '../../../components';
import { DayHeaderCell } from './DayHeaderCell';
import { LocationBookingsCalendarGrid as CalendarGrid } from './LocationBookingsCalendarGrid';
import { SkeletonRows } from './Skeletons';

// BEGIN PLACEHOLDERS

const Placeholder = styled.div`
  background-color: oklch(0% 0 0 / 3%);
  block-size: 100%;
  border: 1px solid oklch(0% 0 0 / 15%);
  border-radius: 0.2rem;
  color: oklch(0% 0 0 / 55%);
  display: grid;
  font-size: 1rem;
  padding: 0.5rem;
  place-items: center;
  text-align: center;
`;

// END PLACEHOLDERS

const thisWeekId = 'location-bookings-calendar__this-week';
const firstDisplayedDateId = 'location-bookings-calendar__beginning';

const isStartOfThisWeek = date => {
  const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  return isSameDay(date, startOfThisWeek);
};

const partitionAppointmentsByLocation = appointments =>
  appointments.reduce((acc, appt) => {
    const locationId = appt.locationId;
    if (!acc[locationId]) acc[locationId] = [];
    acc[locationId].push(appt);
    return acc;
  }, {});

const partitionAppointmentsByDate = appointments =>
  appointments.reduce((acc, appt) => {
    const date = appt.startTime.slice(0, 10); // Slice out ISO date, no time
    if (!acc[date]) acc[date] = [];
    acc[date].push(appt);
    return acc;
  }, {});

const LocationBookingsTopBar = styled(TopBar).attrs({
  title: (
    <TranslatedText stringId="scheduling.locationBookings.title" fallback="Location bookings" />
  ),
})``;

const Wrapper = styled(PageContainer)`
  max-block-size: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
`;

const Filters = styled('search')`
  display: flex;
  gap: 1rem;
`;

const Carousel = styled.div`
  background-color: ${Colors.white};
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  border-radius: 0.2rem;
  margin: 1rem;
  overflow: scroll;
  overscroll-behavior: contain;
  scroll-snap-type: both mandatory;

  @media (prefers-reduced-motion: no-preference) {
    scroll-behavior: smooth;
  }
`;

const BookingsRow = ({ appointments, dates, location }) => {
  const {
    name: locationName,
    locationGroup: { name: locationGroupName },
  } = location;
  const appointmentsByDate = partitionAppointmentsByDate(appointments);

  return (
    <CalendarGrid.Row>
      <CalendarGrid.RowHeaderCell>
        {locationGroupName} {locationName}
      </CalendarGrid.RowHeaderCell>
      {dates.map(d => (
        <CalendarGrid.Cell key={d.valueOf()}>
          {appointmentsByDate[d.toISOString().slice(0, 10)]?.map(a => (
            <AppointmentTile appointment={a} key={a.id} />
          ))}
        </CalendarGrid.Cell>
      ))}
    </CalendarGrid.Row>
  );
};

const getDisplayableDates = date => {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

export const LocationBookingsView = () => {
  const [monthOf, setMonthOf] = useState(startOfToday());
  const displayedDates = getDisplayableDates(monthOf);
  const isFirstDisplayedDate = date => isSameDay(date, displayedDates[0]);

  useEffect(() => {
    document
      .getElementById(isThisMonth(monthOf) ? thisWeekId : firstDisplayedDateId)
      ?.scrollIntoView({ inline: 'start' });
  }, [monthOf]);

  const appointments =
    useLocationBookingsQuery({
      after: displayedDates[0],
      before: endOfDay(displayedDates[displayedDates.length - 1]),
    }).data?.data ?? [];
  const { data: locations, isLoading: locationsAreLoading } = useLocationsQuery({
    includeLocationGroup: true,
  });

  const appointmentsByLocation = partitionAppointmentsByLocation(appointments);

  return (
    <Wrapper>
      <LocationBookingsTopBar>
        <Filters>
          <Placeholder>Search</Placeholder>
          <Placeholder>Area</Placeholder>
          <Placeholder>Clinician</Placeholder>
          <Placeholder>Type</Placeholder>
        </Filters>
      </LocationBookingsTopBar>
      {/* TODO: Extract <Carousel> into <LocationBookingsCalendar> */}
      <Carousel>
        <CalendarGrid.Root $dayCount={displayedDates.length}>
          <CalendarGrid.HeaderRow>
            <CalendarGrid.FirstHeaderCell>
              <Placeholder>Picker</Placeholder>
            </CalendarGrid.FirstHeaderCell>
            {displayedDates.map(d => {
              const elementId = isStartOfThisWeek(d)
                ? thisWeekId
                : isFirstDisplayedDate(d)
                ? firstDisplayedDateId
                : null;
              return (
                <DayHeaderCell
                  date={d}
                  dim={!isSameMonth(d, monthOf)}
                  id={elementId}
                  key={d.valueOf()}
                />
              );
            })}
          </CalendarGrid.HeaderRow>
          {locationsAreLoading ? (
            <SkeletonRows colCount={displayedDates.length} />
          ) : (
            locations?.map(location => (
              <BookingsRow
                appointments={appointmentsByLocation[location.id] ?? []}
                dates={displayedDates}
                key={location.code}
                location={location}
              />
            ))
          )}
        </CalendarGrid.Root>
      </Carousel>
    </Wrapper>
  );
};
