import styled from 'styled-components';
import { Colors } from '../../../constants';

export const CalendarGrid = styled.div`
  --header-col-width: 10rem;
  --header-row-height: 4rem; // Explicitly set, because scroll margins are relative to this
  --col-width: 12rem;
  --row-height: calc(1lh + 1rem);

  --border-style: max(0.0625rem, 1px) solid ${Colors.outline};
  --weekend-color: color-mix(in oklab, white 100%, ${Colors.softOutline} 30%);

  display: grid;
  font-size: 0.875rem;
  font-variant-numeric: lining-nums tabular-nums;
  grid-auto-columns: var(--col-width);
  grid-template-columns: var(--header-col-width) repeat(
      ${({ $dayCount = 42 }) => $dayCount},
      var(--col-width)
    );
`;

export const CalendarRow = styled.div`
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;

  &:not(:last-child) {
    border-block-end: var(--border-style);
  }
`;

export const CalendarHeaderRow = styled(CalendarRow)`
  inset-block-start: 0;
  position: sticky;
  z-index: 1; // Above body cells
`;

export const CalendarCell = styled.div`
  scroll-snap-align: start;
  scroll-margin-block-start: calc(var(--header-row-height) + 1.25rem);
  scroll-margin-inline-start: calc(var(--header-col-width) + 2rem);

  padding-block: 0.25rem;
  padding-inline: 0.5rem 1.5rem;
  transition: background-color 100ms ease;
  vertical-align: top;

  &:not(:last-child) {
    border-inline-end: var(--border-style);
  }
`;

export const CalendarHeaderCell = styled(CalendarCell)`
  background-color: white;
  font-weight: 400;
  padding: 0.5rem;

  transition: background-color 100ms ease;
`;

export const CalendarTopLeftHeaderCell = styled(CalendarHeaderCell)`
  inset-inline-start: 0;
  position: sticky;
  z-index: 1; // Above other header cells
`;

export const CalendarColHeaderCell = styled(CalendarHeaderCell)`
  block-size: var(--header-row-height);
  text-align: center;

  &:is(:nth-child(7n), :nth-child(7n + 1)) {
    background-color: var(--weekend-color);
  }
`;

export const CalendarRowHeaderCell = styled(CalendarHeaderCell)`
  inset-inline-start: 0;
  position: sticky;
`;

export const CalendarBodyCell = styled(CalendarCell)`
  cursor: pointer;
  min-block-size: var(--row-height);

  &:is(:nth-child(7n), :nth-child(7n + 1)) {
    background-color: var(--weekend-color);
  }

  // When hovering directly over this element, not any children of it
  &:hover:not(:has(:hover)) {
    background-color: ${Colors.veryLightBlue};
  }
`;
