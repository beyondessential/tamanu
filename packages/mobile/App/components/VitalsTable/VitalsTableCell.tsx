import React, { PropsWithChildren } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';

export const VitalsTableCell = ({
  children,
}: PropsWithChildren<any>): JSX.Element => (
  <StyledView
    paddingLeft={15}
    width="100%"
    height={45}
    justifyContent="center"
    borderBottomWidth={1}
    borderColor={theme.colors.BOX_OUTLINE}
    borderRightWidth={1}
  >
    <StyledText fontSize={13} color={theme.colors.TEXT_DARK}>
      {children}
    </StyledText>
  </StyledView>
);
