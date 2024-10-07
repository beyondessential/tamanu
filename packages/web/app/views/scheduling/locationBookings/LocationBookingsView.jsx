import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import React, { useState } from 'react';
import styled from 'styled-components';

import { useLocationsQuery } from '../../../api/queries';
import { Colors } from '../../../constants';
import { PageContainer, TopBar, TranslatedText } from '../../../components';
import { DayHeaderCell } from './DayHeaderCell';
import {
  CalendarBodyCell,
  CalendarGrid,
  CalendarHeaderRow,
  CalendarRow,
  CalendarRowHeaderCell,
  CalendarTopLeftHeaderCell,
} from './LocationBookingsCalendarGrid.jsx';
import { useLocationBookingsQuery } from '../../../api/queries/useAppointmentsQuery.js';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';

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

const LocationBookingsTopBar = styled(TopBar).attrs({
  title: (
    <TranslatedText stringId="scheduling.locationBookings.title" fallback="Location bookings" />
  ),
})``;

const Wrapper = styled(PageContainer)`
  max-block-size: 100%;
  display: grid;
  grid-template-rows: min-content 1fr;
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
`;

const getDisplayableDates = date => {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

export const LocationBookingsView = () => {
  const [monthOf, setMonthOf] = useState(new Date());
  const displayedDates = getDisplayableDates(monthOf);

  const appointments = useLocationBookingsQuery().data?.data ?? [];
  const { data: locations } = useLocationsQuery({ includeLocationGroup: true });

  console.log('locations', locations);
  console.log('appointments', appointments);

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
      <Carousel>
        <CalendarGrid $dayCount={displayedDates.length}>
          <CalendarHeaderRow>
            <CalendarTopLeftHeaderCell>
              <Placeholder>Picker</Placeholder>
            </CalendarTopLeftHeaderCell>
            {displayedDates.map(d => (
              <DayHeaderCell date={d} dim={!isSameMonth(d, monthOf)} key={d.valueOf()} />
            ))}
          </CalendarHeaderRow>
          {locations?.map(
            ({ code, name: locationName, locationGroup: { name: locationGroupName } }) => (
              <CalendarRow key={code}>
                <CalendarRowHeaderCell>
                  {locationGroupName} {locationName}
                </CalendarRowHeaderCell>
                {displayedDates.map(d => (
                  <CalendarBodyCell key={d.valueOf()}>
                    {appointments?.[0] && <AppointmentTile appointment={appointments[0]} />}
                  </CalendarBodyCell>
                ))}
              </CalendarRow>
            ),
          )}
        </CalendarGrid>
      </Carousel>
    </Wrapper>
  );
};
