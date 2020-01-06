import React from 'react';
import { theme } from '../../styled/theme';
import { StyledText, StyledView } from '../../styled/common';

interface TableTitleProps {
  title: string;
}

export const TableTitle = ({ title }: TableTitleProps): JSX.Element => (
  <StyledView
    background={theme.colors.MAIN_SUPER_DARK}
    width={130}
    paddingTop={15}
    paddingBottom={15}
    justifyContent="center"
    paddingLeft={15}
  >
    <StyledText fontSize={12} fontWeight={700} color={theme.colors.WHITE}>
      {title}
    </StyledText>
  </StyledView>
);
