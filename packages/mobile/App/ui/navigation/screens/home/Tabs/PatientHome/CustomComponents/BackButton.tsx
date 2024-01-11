import React, { FC, ReactElement } from 'react';
import { ArrowLeftIcon } from '/components/Icons';
import { StyledTouchableOpacity, StyledView } from '/styled/common';
import { ButtonProps } from './fixture';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

export const BackButton: FC<ButtonProps> = ({
  onPress,
}: ButtonProps): ReactElement => (
  <StyledTouchableOpacity onPress={onPress}>
    <StyledView
      alignItems="center"
      paddingTop={screenPercentageToDP(2.43, Orientation.Height)}
      paddingBottom={screenPercentageToDP(2.43, Orientation.Height)}
      width={screenPercentageToDP(19.46, Orientation.Width)}
      paddingRight={screenPercentageToDP(4.86, Orientation.Width)}
    >
      <ArrowLeftIcon size={screenPercentageToDP(2.43, Orientation.Height)} />
    </StyledView>
  </StyledTouchableOpacity>
);
