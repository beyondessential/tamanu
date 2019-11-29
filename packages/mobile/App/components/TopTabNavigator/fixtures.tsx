import React from 'react';
import { StyledView, StyledText } from '../../styled/common';
import theme from '../../styled/theme';
import { createAppContainer } from 'react-navigation';
import { TopTabNavigator } from './index';

export const Visits = () => (
  <StyledView
    flex={1}
    background="#ff4081"
    justifyContent="center"
    alignItems="center">
    <StyledText fontSize={30} color={theme.colors.WHITE}>
      Visits
    </StyledText>
  </StyledView>
);

export const Vitals = () => (
  <StyledView
    flex={1}
    background="#673ab7"
    justifyContent="center"
    alignItems="center">
    <StyledText fontSize={30} color={theme.colors.WHITE}>
      Vitals
    </StyledText>
  </StyledView>
);

export const Vaccines = () => (
  <StyledView
    flex={1}
    background="red"
    justifyContent="center"
    alignItems="center">
    <StyledText fontSize={30} color={theme.colors.WHITE}>
      Vaccines
    </StyledText>
  </StyledView>
);

const withTab = TopTabNavigator({
  Visits,
  Vitals,
  Vaccines,
});

export const App = createAppContainer(withTab);
