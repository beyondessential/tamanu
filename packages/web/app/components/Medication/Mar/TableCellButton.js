import { UnstyledHtmlButton } from '@tamanu/ui-components';
import styled from 'styled-components';

const TableCellButton = styled(UnstyledHtmlButton)`
  background-color: ${p => p.theme.palette.background.paper};
  block-size: 100%;
  inline-size: 100%;
  padding: 10px;
  &:not(:disabled) {
    cursor: pointer;
  }
  &:not(:disabled):is(:active, :focus-visible, :hover) {
    background-color: ${p => p.theme.palette.action.hover};
  }
  &:disabled {
    background-color: ${p => p.theme.palette.background.default};
  }
`;

export default TableCellButton;
