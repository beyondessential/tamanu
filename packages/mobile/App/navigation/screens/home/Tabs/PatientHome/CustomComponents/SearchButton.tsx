import React, { FC, ReactElement } from 'react';
import { Button } from '/components/Button';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { Search } from '/components/Icons';
import { StyledText } from '/styled/common';
import { ButtonProps } from './fixture';

export const SearchButton: FC<ButtonProps> = ({
  onPress,
}: ButtonProps): ReactElement => (
  <Button
    height={screenPercentageToDP(4.25, Orientation.Height)}
    width={screenPercentageToDP(65.59, Orientation.Width)}
    borderRadius={40}
    backgroundColor="#215383"
    onPress={onPress}
  >
    <Search fill="#67A6E3" />
    <StyledText marginLeft={10} color="#67A6E3">
      Search for patients
    </StyledText>
  </Button>
);
