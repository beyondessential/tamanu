import { Skeleton } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import { CarouselComponents as CalendarGrid } from './CarouselComponents';

const SkeletonRowHeaderCell = () => (
  <CalendarGrid.RowHeaderCell data-testid="rowheadercell-mht9">
    <Skeleton animation="wave" variant="text" width="8em" data-testid="skeleton-l9w9" />
    <Skeleton animation="wave" variant="text" width="5em" data-testid="skeleton-42iz" />
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
  <CalendarGrid.Row data-testid={`row-ehpg-${colCount}`}>
    <SkeletonRowHeaderCell data-testid="skeletonrowheadercell-mts6" />
    {Array.from({ length: colCount }).map((_, i) => (
      <SkeletonBodyCell key={i} data-testid={`skeletonbodycell-uelj-${i}`} />
    ))}
  </CalendarGrid.Row>
);

export const SkeletonRows = ({ colCount }) =>
  Array.from({ length: 7 }).map((_, i) => <SkeletonRow colCount={colCount} key={i} />);
