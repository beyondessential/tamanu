import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import React from 'react';

interface VitalsTableRowHeaderProps {
  title: string;
  isOdd: boolean;
}

export const VitalsTableRowHeader = ({ title, isOdd }: VitalsTableRowHeaderProps): JSX.Element => (
  <StyledView
    width={screenPercentageToDP(31.63, Orientation.Width)}
    borderRightWidth={1}
    borderColor={theme.colors.BOX_OUTLINE}
    paddingLeft={screenPercentageToDP(3.64, Orientation.Width)}
    height={screenPercentageToDP(6.46, Orientation.Height)}
    justifyContent="center"
    background={isOdd ? theme.colors.BACKGROUND_GREY : theme.colors.WHITE}
  >
    <StyledText
      fontSize={screenPercentageToDP(1.57, Orientation.Height)}
      color={theme.colors.TEXT_DARK}
      fontWeight={500}
    >
      {title}
    </StyledText>
  </StyledView>
);
