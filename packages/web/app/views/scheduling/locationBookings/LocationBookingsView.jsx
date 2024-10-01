import { eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import React, { useState } from 'react';
import styled from 'styled-components';

import { uniqueIsoWeeksInMonthOf } from '@tamanu/shared/utils/dateTime';

import { useAppointmentsQuery, useLocationsQuery } from '../../../api/queries';
import { Colors } from '../../../constants';
import { PageContainer, TopBar, TranslatedText } from '../../../components';
import { DayHeaderCell } from './DayHeaderCell';
import {
  CalendarCell,
  CalendarRowHeader,
  CalendarTable,
  CalendarTableRow,
} from './TableComponents';

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

export const LocationBookingsView = () => {
  const [monthOf, setMonthOf] = useState(new Date());
  const weekCount = uniqueIsoWeeksInMonthOf(monthOf);

  const firstDisplayedDate = startOfWeek(startOfMonth(monthOf), { weekStartsOn: 1 });
  const lastDisplayedDate = endOfWeek(endOfMonth(monthOf), { weekStartsOn: 1 });
  const displayedDates = eachDayOfInterval({ start: firstDisplayedDate, end: lastDisplayedDate });

  const { data: appointments } = useAppointmentsQuery();
  const { data: locations } = useLocationsQuery();

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
        <CalendarTable>
          <thead>
            <CalendarTableRow>
              <CalendarRowHeader>
                <Placeholder>Month Selector</Placeholder>
              </CalendarRowHeader>
              {displayedDates.map(d => (
                <DayHeaderCell date={d} key={d.valueOf()} />
              ))}
            </CalendarTableRow>
          </thead>
          <tbody>
            {locations?.map(({ name: locationName, code }) => (
              <CalendarTableRow key={code}>
                <CalendarRowHeader>{locationName}</CalendarRowHeader>
                {displayedDates.map(d => (
                  <CalendarCell key={d.valueOf()} />
                ))}
              </CalendarTableRow>
            ))}
          </tbody>
        </CalendarTable>
      </Carousel>
    </Wrapper>
  );
};
