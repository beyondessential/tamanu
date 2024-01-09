import React, { FC, ReactElement } from 'react';
import { ButtonProps } from './fixture';
import { KebabIcon } from '/components/Icons';
import { StyledTouchableOpacity, StyledView } from '/styled/common';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

export const DotsMenuButton: FC<ButtonProps> = ({
  onPress,
}: ButtonProps): ReactElement => (
  <StyledTouchableOpacity onPress={onPress}>
    <StyledView
      alignItems="center"
      paddingTop={screenPercentageToDP(2.43, Orientation.Height)}
      paddingBottom={screenPercentageToDP(2.43, Orientation.Height)}
      width={screenPercentageToDP(19.46, Orientation.Width)}
    >
      <KebabIcon />
    </StyledView>
  </StyledTouchableOpacity>
);
