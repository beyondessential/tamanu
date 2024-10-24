import { formatISO, isSameDay, isSameMonth, isThisMonth, startOfToday } from 'date-fns';
import React, { useEffect } from 'react';
import styled, { css } from 'styled-components';

import { isStartOfThisWeek } from '@tamanu/shared/utils/dateTime';

import { Colors } from '../../../constants';
import {
  BodyText,
  Button,
  formatShort,
  formatWeekdayShort,
  MonthYearInput,
} from '../../../components';
import { CarouselComponents as CarouselGrid } from '../locationBookings/CarouselComponents';
import { Box } from '@mui/material';

const StyledFirstHeaderCell = styled(CarouselGrid.FirstHeaderCell)`
  display: grid;
  gap: 0.25rem;
  grid-template-columns: minmax(min-content, 1fr) max-content;
  align-items: center;
`;

const StyledButton = styled(Button).attrs({ variant: 'text' })`
  font-size: 0.75rem;
  font-weight: 400;
  min-inline-size: 4rem; // Prevent hover effect from affecting layout
  padding: 0.25rem;

  &:hover {
    background-color: initial;
    font-weight: 500;
  }

  &,
  &:hover {
    text-decoration-line: underline;
    text-decoration-thickness: from-font;
  }

  .MuiButton-label {
    display: contents;
  }
`;

const HeaderCell = styled.div`
  --base-font-weight: 400;
  font-size: 1rem;
  font-weight: var(--base-font-weight);
  line-height: 1.3;
  width: 10rem;
  padding: 0.5rem 0.5rem;
  text-align: center;
  border-inline-end: 1px solid ${Colors.outline};
`;

const HeaderText = styled(BodyText)`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-wrap: break-word;
`;

export const DayHeaderCell = ({ entity }) => {
  console.log(entity);
  return (
    <HeaderCell>
      <HeaderText>{entity.displayName}</HeaderText>
    </HeaderCell>
  );
};

export const BookingsCalendarHeader = ({ headerData }) => {
  return (
    <Box display="flex">
      {headerData.map(d => {
        return <DayHeaderCell entity={d} id={d.id} key={d.id} />;
      })}
    </Box>
  );
};
