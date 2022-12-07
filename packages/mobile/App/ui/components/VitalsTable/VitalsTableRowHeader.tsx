import React from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

export const VitalsTableRowHeader = ({ title }: { title: string }): JSX.Element => {
  return (
    <StyledView
      width="100%"
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
};
