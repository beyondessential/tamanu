import styled from 'styled-components';

import { Colors } from '../../../constants';

export const CalendarHeaderCell = styled.th`
  --border: max(0.0625rem, 1px) solid ${Colors.outline};
  border-block-end: var(--border);
  border-inline-end: var(--border);
  font-weight: 400;
  padding: 0.5rem;
  position: sticky;
  transition: background-color 100ms ease;
  z-index: 1;

  thead & {
    block-size: var(--header-row-height);
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
  --border: max(0.0625rem, 1px) solid ${Colors.outline};
  block-size: calc(1lh + 1rem);
  border-block-end: var(--border);
  border-inline-end: var(--border);
  cursor: pointer;
  inline-size: var(--target-col-width);
  min-inline-size: 12rem;
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
  --header-col-width: 10rem;
  --header-row-height: 3rem;
  //--target-col-width: calc((100% - var(--header-col-width)) / 7.5);
  font-size: 0.875rem;
  font-variant-numeric: lining-nums tabular-nums;

  // Prevent header row’s bottom border from from scrolling away
  border-collapse: separate;
  border-spacing: 0;

  td,
  th {
    background-color: white;
    scroll-snap-align: start;
    scroll-margin-block-start: calc(var(--header-row-height) + 1.25rem);
    scroll-margin-inline-start: calc(var(--header-col-width) + 2rem);
  }
`;
