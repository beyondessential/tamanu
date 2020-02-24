import React from 'react';
import { FullView, CenterView, StyledText } from '../../../styled/common';
import { theme } from '../../../styled/theme';
import { disableAndroidBackButton } from '../../../helpers/android';

const HomeScreen = () => {
  disableAndroidBackButton();

  return (
    <FullView background={theme.colors.PRIMARY_MAIN}>
      <CenterView flex={1}>
        <StyledText color={theme.colors.WHITE}>Home</StyledText>
      </CenterView>
    </FullView>
  );
};

export default HomeScreen;
