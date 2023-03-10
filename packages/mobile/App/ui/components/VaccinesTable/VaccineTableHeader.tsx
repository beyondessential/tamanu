import React from 'react';
import { TableHeader } from '../Table';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';

export const vaccineTableHeader: TableHeader = {
  key: 'date',
  accessor: (title) => (
    <StyledView
      paddingTop={15}
      paddingBottom={15}
      width={85}
      height={60}
      justifyContent="center"
      alignItems="center"
      background={theme.colors.MAIN_SUPER_DARK}
    >
      <StyledText textAlign="center" fontSize={12} fontWeight={700} color={theme.colors.WHITE}>
        {title}
      </StyledText>
    </StyledView>
  ),
};
