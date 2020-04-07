import React from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { Column } from '../Table';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

export const VitalsTableRowHeader = ({ col }: { col: Column }): JSX.Element => (
  <StyledView
    width={130}
    borderRightWidth={1}
    borderColor={theme.colors.BOX_OUTLINE}
    background={theme.colors.BACKGROUND_GREY}
    borderBottomWidth={1}
    paddingLeft={15}
    height={screenPercentageToDP(5.46, Orientation.Height)}
    justifyContent="center"
  >
    <StyledText fontSize={13} color={theme.colors.TEXT_SUPER_DARK}>
      {col.title}
    </StyledText>
  </StyledView>
);
