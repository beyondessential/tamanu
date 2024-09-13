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
    padding-block: 0.25rem;
    padding-inline: 0.5rem;
    scroll-snap-align: start;
  }

  tbody th {
    inline-size: var(--header-col-width);
    padding-inline-end: 1rem;
  }
`;

export const CalendarTableRow = styled.tr`
  > :is(th[scope='col'], td):nth-child(7n),
  > :is(th[scope='col'], td):nth-child(7n + 1) {
    background-color: oklch(from ${Colors.softOutline} l c h / 30%);
    @supports not (color: oklch(from black l c h)) {
      background-color: ${Colors.softOutline}4d; // Works only with six-digit hex colour
    }
  }
`;

const CalendarHeaderCell = styled.th`
  --border: max(0.0625rem, 1px) solid ${Colors.outline};
  border-block-end: var(--border);
  border-inline-end: var(--border);
  font-weight: 400;
  position: sticky;
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
