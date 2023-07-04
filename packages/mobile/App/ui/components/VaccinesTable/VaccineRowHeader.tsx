import React from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';

interface VaccineRowHeaderProps {
  title: string;
  subtitle?: string;
}

export const VaccineRowHeader = ({
  title,
  subtitle,
}: VaccineRowHeaderProps): JSX.Element => (
  <StyledView
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
      {title}
    </StyledText>
    {subtitle && (
      <StyledText fontSize={13} color={theme.colors.TEXT_MID}>
        {subtitle}
      </StyledText>
    )}
  </StyledView>
);
