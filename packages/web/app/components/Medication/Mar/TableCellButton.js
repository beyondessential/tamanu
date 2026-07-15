import { UnstyledHtmlButton } from '@tamanu/ui-components';
import styled from 'styled-components';

const TableCellButton = styled(UnstyledHtmlButton)`
  background-color: ${p => p.theme.palette.background.paper};
  outline: 1px solid ${p => p.theme.palette.divider};
  block-size: 100%;
  inline-size: 100%;
  padding: 10px;
  position: relative;

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

export default TableCellButton;
