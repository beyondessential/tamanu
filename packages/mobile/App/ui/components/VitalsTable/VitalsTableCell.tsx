import React, { PropsWithChildren } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

export const VitalsTableCell = ({ data }: PropsWithChildren<any>): JSX.Element => {
  const cellValue = data?.body || '-';
  return (
    <StyledView
      paddingLeft={screenPercentageToDP(3.64, Orientation.Height)}
      width="100%"
      height={screenPercentageToDP(5.46, Orientation.Height)}
      justifyContent="center"
      borderBottomWidth={1}
      borderColor={theme.colors.BOX_OUTLINE}
      borderRightWidth={1}
    >
      <StyledText
        fontSize={screenPercentageToDP(1.57, Orientation.Height)}
        color={theme.colors.TEXT_DARK}
      >
        {cellValue}
      </StyledText>
    </StyledView>
  );
};
