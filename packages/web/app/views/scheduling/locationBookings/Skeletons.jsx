import { Skeleton } from '@material-ui/lab';
import styled from 'styled-components';
import React from 'react';
import { Row, RowHeaderCell } from './LocationBookingsCalendarGrid';

const SkeletonRowHeaderCell = () => (
  <RowHeaderCell>
    <Skeleton animation="wave" variant="text" width="8em" />
    <Skeleton animation="wave" variant="text" width="5em" />
  </RowHeaderCell>
);

const SkeletonBodyCell = styled(Skeleton).attrs({ animation: 'wave', variant: 'rect' })`
  block-size: 100%;
  &:not(:last-child) {
    border-inline-end: var(--border-style); // Defined in LocationBookingsCalendarGrid
  }
`;

const SkeletonRow = ({ colCount }) => (
  <Row>
    <SkeletonRowHeaderCell />
    {Array.from({ length: colCount }).map(() => (
      // eslint-disable-next-line react/jsx-key
      <SkeletonBodyCell />
    ))}
  </Row>
);

export const SkeletonRows = ({ colCount }) => (
  <>
    {Array.from({ length: 7 }).map(() => (
      // eslint-disable-next-line react/jsx-key
      <SkeletonRow colCount={colCount} />
    ))}
  </>
);
