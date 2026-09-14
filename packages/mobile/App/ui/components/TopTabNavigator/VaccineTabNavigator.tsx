import React, { type ComponentType, type FunctionComponent, type ReactElement } from 'react';
import { Dimensions } from 'react-native';
import type { MaterialTopTabNavigationOptions } from '@react-navigation/material-top-tabs';
import { theme } from '/styled/theme';
import { StyledText, StyledView } from '/styled/common';
import * as Icons from '../Icons';
import type { IconWithSizeProps } from '/interfaces/WithSizeProps';
import type { VaccineDataProps } from '../VaccineCard';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { VaccineStatus } from '/helpers/patient';
import { Routes } from '/helpers/routes';
import { TopTabNavigator, TopTabScreen } from './index';

const tabIconSize = screenPercentageToDP(2.5, Orientation.Height);

interface VaccineTab {
  name: string;
  title: string;
  status: VaccineStatus;
  color: string;
  icon: FunctionComponent<IconWithSizeProps>;
}

const VACCINE_TABS = [
  {
    name: Routes.HomeStack.VaccineStack.NewVaccineTabs.GivenOnTimeTab,
    title: 'Given',
    status: VaccineStatus.GIVEN,
    color: theme.colors.SAFE,
    icon: Icons.GivenOnTimeIcon,
  },
  {
    name: Routes.HomeStack.VaccineStack.NewVaccineTabs.NotTakeTab,
    title: 'Not given',
    status: VaccineStatus.NOT_GIVEN,
    color: theme.colors.PRIMARY_MAIN,
    icon: Icons.NotGivenIcon,
  },
] as const satisfies VaccineTab[];

const VaccineTabLabel = ({
  tab: { title, color, icon: Icon },
  focused,
}: {
  tab: VaccineTab;
  focused: boolean;
}) => (
  <StyledView
    height={screenPercentageToDP(7.36, Orientation.Height)}
    alignItems="center"
    paddingTop={screenPercentageToDP(1.03, Orientation.Height)}
  >
    <StyledView>
      {focused ? <Icon size={tabIconSize} /> : <Icons.ScheduledVaccine size={tabIconSize} />}
    </StyledView>
    <StyledText
      marginTop={screenPercentageToDP(1.21, Orientation.Height)}
      textAlign="center"
      fontSize={screenPercentageToDP(1.57, Orientation.Height)}
      color={focused ? color : theme.colors.TEXT_SOFT}
    >
      {title}
    </StyledText>
  </StyledView>
);

const getTabScreenOptions = (tab: VaccineTab): MaterialTopTabNavigationOptions => ({
  tabBarActiveTintColor: tab.color,
  tabBarIndicatorStyle: {
    backgroundColor: tab.color,
  },
  tabBarLabel: ({ focused }) => <VaccineTabLabel tab={tab} focused={focused} />,
});

const navigatorScreenOptions = {
  swipeEnabled: true,
  tabBarStyle: { backgroundColor: theme.colors.WHITE },
} as const satisfies MaterialTopTabNavigationOptions;

const initialLayout = { width: Dimensions.get('window').width };

interface VaccineTabNavigatorProps {
  vaccine: VaccineDataProps;
  component: ComponentType<any>;
}

export const VaccineTabNavigator = ({
  vaccine,
  component,
}: VaccineTabNavigatorProps): ReactElement => {
  const initialTab = VACCINE_TABS.find(tab => tab.status === vaccine.status) ?? VACCINE_TABS[0];

  return (
    <TopTabNavigator
      initialRouteName={initialTab.name}
      initialLayout={initialLayout}
      screenOptions={navigatorScreenOptions}
    >
      {VACCINE_TABS.map(tab => (
        <TopTabScreen
          key={tab.name}
          name={tab.name}
          component={component}
          initialParams={{ vaccine, status: tab.status }}
          options={getTabScreenOptions(tab)}
        />
      ))}
    </TopTabNavigator>
  );
};
