import React from 'react';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

export const VitalsTableTitle = (): JSX.Element => (
  <StyledView
    background={theme.colors.MAIN_SUPER_DARK}
    width={screenPercentageToDP(31.63, Orientation.Width)}
    height={screenPercentageToDP(4.86, Orientation.Height)}
    justifyContent="center"
    paddingLeft={screenPercentageToDP(3.64, Orientation.Width)}
  >
    <StyledText
      fontSize={screenPercentageToDP(1.6, Orientation.Height)}
      fontWeight={600}
      color={theme.colors.WHITE}
    >
      Measure
    </StyledText>
  </StyledView>
);
