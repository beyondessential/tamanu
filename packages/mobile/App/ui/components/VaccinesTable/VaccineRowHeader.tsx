import React from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { Column } from '../Table';

interface VaccineRowHeaderProps {
  row: Column;
}

export const VaccineRowHeader = ({
  row,
}: VaccineRowHeaderProps): JSX.Element => (
  <StyledView
    key={row.key}
    width={130}
    borderRightWidth={1}
    borderColor={theme.colors.BOX_OUTLINE}
    background={theme.colors.BACKGROUND_GREY}
    borderBottomWidth={1}
    paddingLeft={15}
    height={80}
    justifyContent="center"
  >
    <StyledText fontSize={13} color={theme.colors.TEXT_SUPER_DARK}>
      {row.title}
    </StyledText>
    {row.subtitle && (
      <StyledText fontSize={13} color={theme.colors.TEXT_MID}>
        {row.subtitle}
      </StyledText>
    )}
  </StyledView>
);
