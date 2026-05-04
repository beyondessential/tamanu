import { TAMANU_COLORS } from '@tamanu/ui-components';
import { css } from 'styled-components';

const MUI_SPACING_UNIT = 8;

export { MUI_SPACING_UNIT };

// For existing imports of Colors
export const Colors = TAMANU_COLORS;

export const denseTableStyle = {
  container: css`
    border: 0px solid white;
    overflow: visible;
  `,
  cell: css`
    &.MuiTableCell-body {
      padding-block: 4px;
      padding-inline: 0 30px;
    }
    &:first-child {
      padding-inline-start: 0px;
    }
    &:last-child {
      padding-inline-end: 5px;
    }
  `,
  head: css`
    .MuiTableCell-head {
      color: ${Colors.midText};
      font-weight: 400;
      padding-block: 8px;
      padding-inline: 0 30px;
      &:last-child {
        padding-inline-end: 5px;
      }
    }
    .MuiTableSortLabel-root.MuiTableSortLabel-active {
      color: ${Colors.midText};
      font-weight: 400;
    }
  `,
  statusCell: css`
    &.MuiTableCell-body {
      padding-block: 12px;
      padding-inline: 0px;
      text-align: start;
    }
  `,
};
