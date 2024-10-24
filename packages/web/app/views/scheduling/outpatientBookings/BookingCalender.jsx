import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import React, { useState } from 'react';
import styled from 'styled-components';
import { Colors } from '../../../constants/index';
import { CarouselComponents as CarouselGrid } from '../locationBookings/CarouselComponents';
import { BookingsCalendarBody } from './BookingsCalendarBody';
import { BookingsCalendarHeader } from './BookingsCalendarHeader';
import { Box } from '@mui/material';

const getDisplayableDates = date => {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

const Carousel = styled.div`
  background-color: ${Colors.white};
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  border-radius: 0.2rem;
  margin: 1rem;
  overflow: scroll;
  overscroll-behavior: contain;
  scroll-snap-type: both mandatory;
  width: initial;

  @media (prefers-reduced-motion: no-preference) {
    scroll-behavior: smooth;
  }
`;

const Grid = styled.div`
  --header-col-width: 11.5rem;
  --header-row-height: 4rem; // Explicitly set, because scroll margins are relative to this
  --row-height: calc(1lh + 1rem);

  --border-style: max(0.0625rem, 1px) solid ${Colors.outline};
  --weekend-color: color-mix(in oklab, white 100%, ${Colors.softOutline} 30%);

  display: grid;
  font-size: 0.875rem;
  font-variant-numeric: lining-nums tabular-nums;
  grid-auto-columns: var(--col-width);

  // 42 because a month can span at most 6 distinct ISO weeks
  grid-template-columns: var(--header-col-width) repeat(
      ${({ $dayCount = 42 }) => $dayCount},
      var(--col-width)
    );
`;

const Wrapper = styled(Box)`
  display: flex;
  width: 100%;
  overflow: auto;
  border-top: 1px solid ${Colors.outline};
`;

export const BookingsCalendar = ({ query, openBookingForm, cellData }) => {
  const { data, isLoading } = query;
  const headerData = data?.data || [];

  if (isLoading) {
    return null;
  }

  return (
    <Wrapper>
      <BookingsCalendarHeader headerData={headerData} cellData={cellData} />
    </Wrapper>
  );
};
