import React, { useState } from 'react';
import { StyledView, StyledText } from '../../styled/common';
import theme from '../../styled/theme';
import { createAppContainer } from 'react-navigation';
import { TopTabNavigator } from './index';
import * as Icons from '../Icons';
import { VaccineTabNavigator } from './VaccineTabNavigator';

export const routes = [
  {
    key: 'first',
    title: 'TAKEN ON TIME',
    color: theme.colors.SAFE,
    icon: Icons.TakenOnTime,
  },
  {
    key: 'second',
    title: 'TAKEN NOT ON SCHEDULE',
    color: theme.colors.ORANGE,
    icon: Icons.TakenNotOnTime,
  },
  {
    key: 'third',
    title: 'NOT TAKEN',
    color: theme.colors.PRIMARY_MAIN,
    icon: Icons.NotTaken,
  },
];

export const ViewRouteTexts = {
  first: 'First Route',
  second: 'Second Route',
  third: 'Third Route',
};

export const FirstRoute = () => (
  <StyledView flex={1} background="#ff4081" justifyContent="center">
    <StyledText textAlign="center" fontSize={25} color={theme.colors.WHITE}>
      {ViewRouteTexts.first}
    </StyledText>
  </StyledView>
);

export const SecondRoute = () => (
  <StyledView flex={1} background="#673ab7" justifyContent="center">
    <StyledText textAlign="center" fontSize={25} color={theme.colors.WHITE}>
      {ViewRouteTexts.second}
    </StyledText>
  </StyledView>
);
export const ThirdRoute = () => (
  <StyledView flex={1} background="purple" justifyContent="center">
    <StyledText textAlign="center" fontSize={25} color={theme.colors.WHITE}>
      {ViewRouteTexts.third}
    </StyledText>
  </StyledView>
);

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

export function VaccineTabBaseStory() {
  const [state, setState] = useState({
    index: 0,
    routes,
  });
  return (
    <VaccineTabNavigator
      state={state}
      scenes={{
        first: FirstRoute,
        second: SecondRoute,
        third: ThirdRoute,
      }}
      onChangeTab={setState}
    />
  );
}
