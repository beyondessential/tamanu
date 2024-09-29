import React, { useState } from 'react';
import styled from 'styled-components';

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
import { uniqueIsoWeeksInMonthOf } from '@tamanu/shared/src/utils/dateTime.js';

// BEGIN PLACEHOLDERS

const range = length => Array.from({ length }, (_, i) => i);

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

/**
 * @param start {Date} First day in range, inclusive.
 * @param end {Date} Last day in range, inclusive(!).
 * @returns {Date[]} Array of date objects, each one day apart. If `start` is after `end`, returns
 * an empty array.
 */
const dateRange = (start, end) => {
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const range = [];
  let d = new Date(start);
  // eslint-disable-next-line no-unmodified-loop-condition
  while (d < end) {
    range.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  return range;
};

const getMondayOfWeekOf = date => {
  if (Number.isNaN(date.getTime())) {
    throw Error('getMondayOfWeekOf() called with invalid date');
  }

  const day = date.getDay();
  const daysSinceMonday = (day + 7 - 1) % 7;
  //                                        - 1 because 1 = Monday
  //                                    + 7 to guarantee % result is non-negative

  return new Date(date.getFullYear(), date.getMonth(), day - daysSinceMonday);
};

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
  const dayCount = weekCount * 7;

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
              {range(dayCount).map(i => {
                const date = new Date(Date.now() + MS_PER_DAY * i);
                return <DayHeaderCell date={date} key={date} />;
              })}
            </CalendarTableRow>
          </thead>
          <tbody>
            {locations?.map(({ name: locationName, code }) => (
              <CalendarTableRow key={code}>
                <CalendarRowHeader>{locationName}</CalendarRowHeader>
                {range(dayCount).map(() => (
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
