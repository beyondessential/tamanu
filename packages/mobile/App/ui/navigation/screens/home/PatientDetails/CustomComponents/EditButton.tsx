import React, { ReactElement } from 'react';
import { TouchableProps } from '/interfaces/TouchableProps';
import { StyledTouchableOpacity } from '/styled/common';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { PencilIcon } from '/components/Icons';

export const EditButton = ({ onPress }: TouchableProps): ReactElement => (
  <StyledTouchableOpacity onPress={onPress}>
    <PencilIcon
      height={screenPercentageToDP('2.5', Orientation.Height)}
      width={screenPercentageToDP('2.5', Orientation.Height)}
    />
  </StyledTouchableOpacity>
);
