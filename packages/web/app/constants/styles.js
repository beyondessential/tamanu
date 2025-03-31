export const MUI_SPACING_UNIT = 8;

// Should only be colours that are defined as constants in Figma
// (with the exception of searchTintColor)
export const Colors = {
  primary: '#326699',
  primary30: '#C2D2E1',
  primary10: '#EBF0F5',
  primaryDark: '#2f4358',
  secondary: '#ffcc24',
  alert: '#f76853',
  orange: '#f17f16',
  darkOrange: '#CB6100',
  safe: '#47ca80',
  darkestText: '#444444',
  darkText: '#666666',
  midText: '#888888',
  softText: '#b8b8b8',
  outline: '#dedede',
  softOutline: '#ebebeb',
  background: '#f3f5f7',
  white: '#ffffff',
  offWhite: '#fafafa',
  brightBlue: '#67A6E3',
  blue: '#1172D1',
  veryLightBlue: '#F4F9FF',
  metallicYellow: '#BD9503',
  pink: '#D10580',
  purple: '#4101C9',
  green: '#19934E',
  searchTintColor: '#d2dae3',
  hoverGrey: '#f3f5f7',
};

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
