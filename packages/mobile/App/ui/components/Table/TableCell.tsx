import React, { ReactNode } from 'react';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';

export interface TableCellProps {
  children: ReactNode;
}

export const TableCell : React.FC<TableCellProps> = ({ children }) => (
  <StyledView
    height={45}
    paddingLeft={15}
    width="100%"
    justifyContent="center"
    borderBottomWidth={1}
    borderColor={theme.colors.BOX_OUTLINE}
    borderRightWidth={1}
  >
    {children}
  </StyledView>
);
