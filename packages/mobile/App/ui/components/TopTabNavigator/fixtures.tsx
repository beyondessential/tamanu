import React, { useState, ReactElement } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { createTopTabNavigator } from './index';
import * as Icons from '../Icons';
import { VaccineTabNavigator } from './VaccineTabNavigator';

export const routes = [
  {
    key: 'first',
    title: 'TAKEN ON TIME',
    color: theme.colors.SAFE,
    icon: Icons.TakenOnTimeIcon,
  },
  {
    key: 'second',
    title: 'TAKEN NOT ON SCHEDULE',
    color: theme.colors.ORANGE,
    icon: Icons.TakenNotOnTimeIcon,
  },
  {
    key: 'third',
    title: 'NOT TAKEN',
    color: theme.colors.PRIMARY_MAIN,
    icon: Icons.NotTakenIcon,
  },
];

export const ViewRouteTexts = {
  first: 'First Route',
  second: 'Second Route',
  third: 'Third Route',
};

export const FirstRoute = (): Element => (
  <StyledView flex={1} background="#ff4081" justifyContent="center">
    <StyledText textAlign="center" fontSize={25} color={theme.colors.WHITE}>
      {ViewRouteTexts.first}
    </StyledText>
  </StyledView>
);

export const SecondRoute = (): Element => (
  <StyledView flex={1} background="#673ab7" justifyContent="center">
    <StyledText textAlign="center" fontSize={25} color={theme.colors.WHITE}>
      {ViewRouteTexts.second}
    </StyledText>
  </StyledView>
);
export const ThirdRoute = (): Element => (
  <StyledView flex={1} background="purple" justifyContent="center">
    <StyledText textAlign="center" fontSize={25} color={theme.colors.WHITE}>
      {ViewRouteTexts.third}
    </StyledText>
  </StyledView>
);

export const Visits = (): Element => (
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

export const Vitals = (): Element => (
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

export const Vaccines = (): Element => (
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
  <Tabs.Navigator>
    <Tabs.Screen name="1" component={FirstRoute} />
    <Tabs.Screen name="2" component={SecondRoute} />
    <Tabs.Screen name="3" component={ThirdRoute} />
  </Tabs.Navigator>
);

export function VaccineTabBaseStory(): Element {
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
