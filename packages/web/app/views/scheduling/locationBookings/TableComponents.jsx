import styled from 'styled-components';

import { Colors } from '../../../constants';

export const CalendarTable = styled.table`
  --location-count: 10;
  --week-count: 6; // A month can span 4–6 distinct ISO weeks
  --day-count: calc(var(--week-count) * 7);

  --header-col-width: 8rem;
  --target-col-width: calc((100% - var(--header-col-width)) / 7.5);

  border-collapse: collapse;

  td,
  th {
    scroll-snap-align: start;
  }

  tbody th {
    inline-size: var(--header-col-width);
  }
`;

const CalendarHeaderCell = styled.th`
  --border: max(0.0625rem, 1px) solid ${Colors.outline};
  border-block-end: var(--border);
  border-inline-end: var(--border);
  padding-block: 0.25rem;
  padding-inline: 1rem;
  position: sticky;
  transition: background-color 100ms ease;
`;
export const CalendarRowHeader = styled(CalendarHeaderCell).attrs({ scope: 'col' })``;
export const CalendarColumnHeader = styled(CalendarHeaderCell).attrs({ scope: 'row' })``;

export const CalendarCell = styled.td`
  cursor: pointer;
  inline-size: max(40rem, var(--target-col-width));
  padding-block: 0.25rem;
  padding-inline: 0.5rem;
  transition: background-color 100ms ease;

  &:hover {
    background-color: ${Colors.veryLightBlue};
  }

  --border: max(0.0625rem, 1px) solid ${Colors.outline};
  border-block-end: var(--border);
  border-inline-end: var(--border);
`;
