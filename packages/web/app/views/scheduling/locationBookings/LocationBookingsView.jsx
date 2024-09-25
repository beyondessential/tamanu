import React, { useState } from 'react';
import styled from 'styled-components';

import { useAppointments, useLocations } from '../../../api/queries';
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

const MS_PER_DAY = 86_400_000;

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
  const [weekCount, setWeekCount] = useState(6);
  const [dayCount, setDayCount] = useState(weekCount * 7);
  const { data: appointments } = useAppointments();
  const { data: locations } = useLocations();

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
        <CalendarTable
          style={{
            '--location-count': locations?.length ?? 0,
            '--week-count': weekCount,
          }}
        >
          <thead>
            <CalendarTableRow>
              <CalendarRowHeader>
                <Placeholder>Month Selector</Placeholder>
              </CalendarRowHeader>
              {Array.from({ length: dayCount }).map((_, i) => {
                const date = new Date(Date.now() + 86_400_000 * i);
                return <DayHeaderCell date={date} key={date} />;
              })}
            </CalendarTableRow>
          </thead>
          <tbody>
            {locations?.map(({ name: locationName, code }) => (
              <CalendarTableRow key={code}>
                <CalendarRowHeader>{locationName}</CalendarRowHeader>
                {Array.from({ length: dayCount }).map(() => (
                  <CalendarCell />
                ))}
              </CalendarTableRow>
            ))}
          </tbody>
        </CalendarTable>
      </Carousel>
    </Wrapper>
  );
};
