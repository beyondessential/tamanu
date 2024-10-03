import styled from 'styled-components';

import { Colors } from '../../../constants';

export const CalendarTable = styled.table`
  --header-col-width: 8rem;
  --target-col-width: calc((100% - var(--header-col-width)) / 7.5);
  table-layout: fixed;

  // Prevent header row’s bottom border from from scrolling away
  border-collapse: separate;
  border-spacing: 0;

  td,
  th {
    background-color: white;
    block-size: calc(1lh + 1rem);
    padding-block: 0.25rem;
    padding-inline: 0.5rem;
    scroll-snap-align: start;
  }

  td {
    position: relative;
  }

  th {
    padding-block: 0.5rem;
    position: sticky;
    z-index: 1;
  }

  thead th {
    inset-block-start: 0;

    &:first-child {
      // Top-left-most cell sticks in both directions
      inset-inline-start: 0;
      z-index: 2;
    }
  }

  tbody th {
    inline-size: var(--header-col-width);
    inset-inline-start: 0;
    min-inline-size: var(--header-col-width);
    padding-inline-end: 1rem;
  }
`;

export const CalendarTableRow = styled.tr`
  // Dim weekend columns
  > :is(th[scope='col'], td:not(:hover)):is(:nth-child(7n), :nth-child(7n + 1)) {
    background-color: color-mix(in oklch, white 100%, ${Colors.softOutline} 30%);
  }
`;

export const CalendarHeaderCell = styled.th`
  --border: max(0.0625rem, 1px) solid ${Colors.outline};
  border-block-end: var(--border);
  border-inline-end: var(--border);
  font-weight: 400;
  transition: background-color 100ms ease;
`;
export const CalendarColumnHeader = styled(CalendarHeaderCell).attrs({ scope: 'col' })`
  text-align: center;
`;
export const CalendarRowHeader = styled(CalendarHeaderCell).attrs({ scope: 'row' })`
  text-align: start;
`;

export const CalendarCell = styled.td`
  cursor: pointer;
  inline-size: var(--target-col-width);
  min-inline-size: 10rem;
  transition: background-color 100ms ease;

  &:hover {
    background-color: ${Colors.veryLightBlue};
  }

  --border: max(0.0625rem, 1px) solid ${Colors.outline};
  border-block-end: var(--border);
  border-inline-end: var(--border);
`;
