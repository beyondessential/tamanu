import React from 'react';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';

export const vaccineTableHeader = {
  key: 'date',
  tableHeader: true,
  accessor: (title: string): JSX.Element => (
    <StyledView
      paddingTop={15}
      paddingBottom={15}
      width={85}
      height={60}
      justifyContent="center"
      alignItems="center"
      background={theme.colors.MAIN_SUPER_DARK}
    >
      <StyledText
        textAlign="center"
        fontSize={12}
        fontWeight={700}
        color={theme.colors.WHITE}
      >
        {title}
      </StyledText>
    </StyledView>
  ),
};
