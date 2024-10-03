import styled from 'styled-components';

import { Colors } from '../../../constants';

export const CalendarHeaderCell = styled.th`
  font-weight: 400;
  padding: 0.5rem;
  position: sticky;
  transition: background-color 100ms ease;
  z-index: 1;

  thead & {
    block-size: var(--header-row-height);
    inline-size: var(--col-width);
    inset-block-start: 0;

    // Top-left-most cell sticks in both directions
    &:first-child {
      inset-inline-start: 0;
      z-index: 2;
    }
  }

  tbody & {
    inline-size: var(--header-col-width);
    inset-inline-start: 0;
    min-inline-size: var(--header-col-width);
  }
`;
export const CalendarColumnHeader = styled(CalendarHeaderCell).attrs({ scope: 'col' })`
  text-align: center;
`;
export const CalendarRowHeader = styled(CalendarHeaderCell).attrs({ scope: 'row' })`
  text-align: start;
`;

export const CalendarCell = styled.td`
  block-size: var(--row-height);
  cursor: pointer;
  min-inline-size: var(--col-width);
  padding-block: 0.25rem;
  padding-inline: 0.5rem 1.5rem;
  position: relative;
  transition: background-color 100ms ease;
  vertical-align: top;

  &:not(:has(:hover)):hover {
    background-color: ${Colors.veryLightBlue};
  }
`;

export const CalendarTableRow = styled.tr`
  // Dim weekend columns
  > :is(${CalendarColumnHeader}, ${CalendarCell}:not(:hover)):is(:nth-child(7n), :nth-child(7n
        + 1)) {
    background-color: color-mix(in oklch, white 100%, ${Colors.softOutline} 30%);
  }
`;

export const CalendarTable = styled.table`
  --border-style: max(0.0625rem, 1px) solid ${Colors.outline};
  --header-col-width: 10rem;
  --header-row-height: 3rem;
  --col-width: 12rem;
  --row-height: calc(1lh + 1rem);
  font-size: 0.875rem;
  font-variant-numeric: lining-nums tabular-nums;

  // Prevent header row’s bottom border from from scrolling away
  border-collapse: separate;
  border-spacing: 0;

  th,
  td {
    background-color: white;
    scroll-snap-align: start;
    scroll-margin-block-start: calc(var(--header-row-height) + 1.25rem);
    scroll-margin-inline-start: calc(var(--header-col-width) + 2rem);
  }

  & :is(td, th):not(:last-child) {
    border-inline-end: var(--border-style);
  }

  & tr:not(tbody > :last-child) :is(th, td) {
    border-block-end: var(--border-style);
  }
`;
