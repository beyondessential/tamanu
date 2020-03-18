import React from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { Column } from '../Table';

export const VitalsTableRowHeader = ({ col }: { col: Column }): JSX.Element => (
  <StyledView
    width={130}
    borderRightWidth={1}
    borderColor={theme.colors.BOX_OUTLINE}
    background={theme.colors.BACKGROUND_GREY}
    borderBottomWidth={1}
    paddingLeft={15}
    height={45}
    justifyContent="center"
  >
    <StyledText fontSize={13} color={theme.colors.TEXT_SUPER_DARK}>
      {col.title}
    </StyledText>
  </StyledView>
);
