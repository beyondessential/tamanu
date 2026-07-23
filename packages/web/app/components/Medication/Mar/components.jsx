import { UnstyledHtmlButton } from '@tamanu/ui-components';
import styled from 'styled-components';

export const MarCellButton = styled(UnstyledHtmlButton)`
  background-color: ${p => p.theme.palette.background.paper};
  block-size: 100%;
  inline-size: 100%;
  position: relative;

  th & {
    padding: 10px;
  }
  &:not(:disabled) {
    cursor: pointer;
  }
  &:not(:disabled):is(:active, :focus-visible, :hover) {
    background-color: ${p => p.theme.palette.action.hover};
  }
  &:disabled {
    background-color: ${p => p.theme.palette.background.default};
  }
  &[data-inactive='true'] {
    background-image: linear-gradient(${p => p.theme.palette.divider} 1px, transparent 1px);
    background-size: 100% 5px;
    background-position: 0 2.5px;
  }
  &[data-paused='true']:disabled {
    /* Still considered inactive, but keep white background to distinguish from ‘discontinued’ */
    background-color: unset;
  }
  &[data-discontinued='true'],
  &[data-ended='true'] {
    background-color: ${p => p.theme.palette.background.default};
    color: ${p => p.theme.palette.text.tertiary};
  }
  &&[aria-selected='true'] {
    background-color: ${p => p.theme.palette.background.paper};
    /* outline (not border) to pixel-align with parent borders, rather than being inset by 1px */
    outline: 1px solid ${p => p.theme.palette.primary.main};
  }
`;

export const MarDataCell = styled.td`
  position: relative;
  &:has(${MarCellButton}:nth-of-type(2)) {
    /* <table> sets horizontal borders are set on <tr>, so fully define border style */
    border-block: 1px solid ${p => p.theme.palette.text.secondary};
  }
  &:has(${MarCellButton}:nth-of-type(2)):not([aria-current='time']) {
    /* <table> sets vertical borders on <td>, so just override color */
    border-inline-color: ${p => p.theme.palette.text.secondary};
  }
  &:has([data-paused='true']) + &:has([data-discontinued='true']) {
    border-inline-start-color: ${p => p.theme.palette.text.secondary};
  }
`;
