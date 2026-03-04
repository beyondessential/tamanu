import { TAMANU_COLORS } from '@tamanu/ui-components';
import { createGlobalStyle } from 'styled-components';

const MUI_SPACING_UNIT = 8;

export { MUI_SPACING_UNIT };

// For existing imports of Colors
export const Colors = TAMANU_COLORS;

export const denseTableStyle = {
  container: 'border: 0px solid white; overflow: visible;',
  cell: `
    &.MuiTableCell-body {
      padding: 4px 30px 4px 0px;
    }
    &:first-child {
      padding-left: 0px;
    }
    &:last-child {
      padding-right: 5px;
    }
  `,
  head: `
    .MuiTableCell-head {
      color: ${Colors.midText};
      font-weight: 400;
      padding: 8px 30px 8px 0px;
      &:last-child {
        padding-right: 5px;
      }
    }
    .MuiTableSortLabel-root.MuiTableSortLabel-active {
      color: ${Colors.midText};
      font-weight: 400;
    }
  `,
  statusCell: `
    &.MuiTableCell-body {
      padding: 12px 0px; text-align: left;
    }
  `,
};

export const GlobalStyles = createGlobalStyle`
  .pointer-events-none {
    pointer-events: none;
  }
`;
