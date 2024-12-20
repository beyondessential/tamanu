import { Skeleton } from '@material-ui/lab';
import React from 'react';
import styled from 'styled-components';

import { CarouselComponents as CalendarGrid } from './CarouselComponents';

const SkeletonRowHeaderCell = () => (
  <CalendarGrid.RowHeaderCell>
    <Skeleton animation="wave" variant="text" width="8em" />
    <Skeleton animation="wave" variant="text" width="5em" />
  </CalendarGrid.RowHeaderCell>
);

const SkeletonBodyCell = styled(Skeleton).attrs({
  animation: 'wave',
  variant: 'rect',
})`
  block-size: 100%;
  &:not(:last-child) {
    border-inline-end: var(--border-style); // Defined in LocationBookingsCalendarGrid
  }
`;

const SkeletonRow = ({ colCount }) => (
  <CalendarGrid.Row>
    <SkeletonRowHeaderCell />
    {Array.from({ length: colCount }).map((_, i) => (
      <SkeletonBodyCell key={i} />
    ))}
  </CalendarGrid.Row>
);

export const SkeletonRows = ({ colCount }) =>
  Array.from({ length: 7 }).map((_, i) => <SkeletonRow colCount={colCount} key={i} />);
