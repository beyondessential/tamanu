import React from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

interface Props {
  title: string;
}

export const VitalsTableRowHeader: React.FC<Props> = ({ title }) => (
  <StyledView
    width={screenPercentageToDP(31.63, Orientation.Width)}
    borderRightWidth={1}
    borderColor={theme.colors.BOX_OUTLINE}
    background={theme.colors.BACKGROUND_GREY}
    borderBottomWidth={1}
    paddingLeft={screenPercentageToDP(3.64, Orientation.Width)}
    height={screenPercentageToDP(5.46, Orientation.Height)}
    justifyContent="center"
  >
    <StyledText
      fontSize={screenPercentageToDP(1.57, Orientation.Height)}
      color={theme.colors.TEXT_SUPER_DARK}
    >
      {title}
    </StyledText>
  </StyledView>
);
