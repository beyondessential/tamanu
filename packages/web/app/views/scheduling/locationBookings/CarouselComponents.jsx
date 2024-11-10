import styled from 'styled-components';
import { Colors } from '../../../constants';

const Grid = styled.div`
  --header-col-width: 11.5rem;
  --header-row-height: 4rem; // Explicitly set, because scroll margins are relative to this
  --col-width: 12rem;
  --row-height: calc(1lh + 1rem);

  --border-style: max(0.0625rem, 1px) solid ${Colors.outline};
  --weekend-color: color-mix(in oklab, white 100%, ${Colors.softOutline} 30%);

  display: grid;
  font-size: 0.875rem;
  font-variant-numeric: lining-nums tabular-nums;
  grid-auto-columns: var(--col-width);

  // 42 because a month can span at most 6 distinct ISO weeks
  grid-template-columns: var(--header-col-width) repeat(
      ${({ $dayCount = 42 }) => $dayCount},
      var(--col-width)
    );
`;

const Row = styled.div`
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  min-block-size: var(--row-height);

  &:not(:last-child) {
    border-block-end: var(--border-style);
  }
`;

const HeaderRow = styled(Row)`
  block-size: var(--header-row-height);
  inset-block-start: 0;
  position: sticky;
  z-index: 2;
`;

const BaseCell = styled.div`
  min-block-size: var(--row-height);
  padding-block: 0.25rem;
  padding-inline: 0.5rem 1.5rem;
  scroll-margin-block-start: calc(var(--header-row-height) + 1.25rem);
  scroll-margin-inline-start: calc(var(--header-col-width) + 2rem);
  scroll-snap-align: start;
  transition: background-color 100ms ease;
  vertical-align: top;

  &:not(:last-child) {
    border-inline-end: var(--border-style);
  }
`;

const HeaderCell = styled(BaseCell)`
  background-color: white;
  display: flex;
  flex-direction: column;
  font-weight: 400;
  padding: 0.5rem;
  place-content: center;
  transition: background-color 100ms ease;
  z-index: 1;
`;

const FirstHeaderCell = styled(HeaderCell)`
  inset-inline-start: 0;
  position: sticky;
  z-index: 2;
`;

const ColHeaderCell = styled(HeaderCell)`
  text-align: center;

  &:is(:nth-child(7n), :nth-child(7n + 1)) {
    background-color: var(--weekend-color);
  }
`;

const RowHeaderCell = styled(HeaderCell)`
  inset-inline-start: 0;
  position: sticky;
  text-wrap: balance;
`;

const BodyCell = styled(BaseCell).attrs({ as: 'button' })`
  // Reset browser <button> styles
  appearance: none;
  background-color: unset;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-style: inherit;
  line-height: inherit;
  text-align: inherit;
  align-items: stretch;

  align-items: stretch;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  &:is(:nth-child(7n), :nth-child(7n + 1)) {
    background-color: var(--weekend-color);
  }

  // When hovering directly over this element, not any children of it
  &:hover:not(:has(:hover)),
  &:focus-visible {
    background-color: ${Colors.veryLightBlue};
  }
`;

export const CarouselComponents = {
  Root: Grid,
  Row,
  HeaderRow,
  HeaderCell,
  FirstHeaderCell,
  ColHeaderCell,
  RowHeaderCell,
  Cell: BodyCell,
};
