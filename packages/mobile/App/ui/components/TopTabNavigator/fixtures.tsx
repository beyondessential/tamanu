import React, { useState, ReactElement } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { createTopTabNavigator } from './index';
import * as Icons from '../Icons';
import { VaccineTabNavigator } from './VaccineTabNavigator';
import {NavigationContainer} from "@react-navigation/native";

export const routes = [
  {
    key: 'first',
    title: 'GIVEN ON TIME',
    color: theme.colors.SAFE,
    icon: Icons.GivenOnTimeIcon,
  },
  {
    key: 'second',
    title: 'GIVEN NOT ON SCHEDULE',
    color: theme.colors.ORANGE,
    icon: Icons.GivenNotOnTimeIcon,
  },
  {
    key: 'third',
    title: 'NOT GIVEN',
    color: theme.colors.PRIMARY_MAIN,
    icon: Icons.NotGivenIcon,
  },
];

export const ViewRouteTexts = {
  first: 'First Route',
  second: 'Second Route',
  third: 'Third Route',
};

export const FirstRoute = (): JSX.Element => (
  <StyledView flex={1} background="#ff4081" justifyContent="center">
    <StyledText textAlign="center" fontSize={25} color={theme.colors.WHITE}>
      {ViewRouteTexts.first}
    </StyledText>
  </StyledView>
);

export const SecondRoute = (): JSX.Element => (
  <StyledView flex={1} background="#673ab7" justifyContent="center">
    <StyledText textAlign="center" fontSize={25} color={theme.colors.WHITE}>
      {ViewRouteTexts.second}
    </StyledText>
  </StyledView>
);
export const ThirdRoute = (): JSX.Element => (
  <StyledView flex={1} background="purple" justifyContent="center">
    <StyledText textAlign="center" fontSize={25} color={theme.colors.WHITE}>
      {ViewRouteTexts.third}
    </StyledText>
  </StyledView>
);

export const Visits = (): JSX.Element => (
  <StyledView
    flex={1}
    background="#ff4081"
    justifyContent="center"
    alignItems="center"
  >
    <StyledText fontSize={30} color={theme.colors.WHITE}>
      Visits
    </StyledText>
  </StyledView>
);

export const Vitals = (): JSX.Element => (
  <StyledView
    flex={1}
    background="#673ab7"
    justifyContent="center"
    alignItems="center"
  >
    <StyledText fontSize={30} color={theme.colors.WHITE}>
      Vitals
    </StyledText>
  </StyledView>
);

export const Vaccines = (): JSX.Element => (
  <StyledView
    flex={1}
    background="red"
    justifyContent="center"
    alignItems="center"
  >
    <StyledText fontSize={30} color={theme.colors.WHITE}>
      Vaccines
    </StyledText>
  </StyledView>
);

const Tabs = createTopTabNavigator();

export const App = (): ReactElement => (
  <NavigationContainer>
    <Tabs.Navigator>
    <Tabs.Screen name="1" component={FirstRoute} />
    <Tabs.Screen name="2" component={SecondRoute} />
    <Tabs.Screen name="3" component={ThirdRoute} />
  </Tabs.Navigator>
  </NavigationContainer>
);

export function VaccineTabBaseStory(): JSX.Element {
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
