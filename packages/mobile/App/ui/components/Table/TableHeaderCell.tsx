import React from 'react';
import { TableCellProps } from './TableCell';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';

export const TableHeaderCell : React.FC<TableCellProps> = ({
  children,
}) => (
  <StyledView
    paddingTop={15}
    paddingBottom={15}
    width={85}
    justifyContent="center"
    alignItems="center"
    background={theme.colors.MAIN_SUPER_DARK}
  >
    <StyledText fontSize={12} fontWeight={700} color={theme.colors.WHITE}>
      {children}
    </StyledText>
  </StyledView>
);
