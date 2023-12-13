import { KebabIcon } from '/components/Icons';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { StyledTouchableOpacity, StyledView } from '/styled/common';
import React, { FC, ReactElement } from 'react';
import { ButtonProps } from './fixture';

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
