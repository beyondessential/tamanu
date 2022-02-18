import React, { ReactNode } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';

interface TableHeaderCellProps {
  children: ReactNode;
}

export const TableHeaderCell = ({
  children,
}: TableHeaderCellProps): JSX.Element => (
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
