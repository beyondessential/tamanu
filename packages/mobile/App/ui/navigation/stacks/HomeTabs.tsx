import React, { FC, ReactElement } from 'react';
import { compose } from 'redux';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';

import { PatientHome } from '/navigation/screens/home/Tabs/PatientHome';
import { CenterView } from '/styled/common';
import { theme } from '/styled/theme';
import { HomeScreen } from '/navigation/screens/home/Tabs/HomeScreen';
import { withPatient } from '/containers/Patient';
import { SvgProps } from 'react-native-svg';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import { Routes } from '/helpers/routes';
import {
  HomeBottomLogoIcon,
  BarChartIcon,
  SyncDataIcon,
  MoreMenuIcon,
} from '/components/Icons';
import {
  ReportScreen,
  SyncDataScreen,
  MoreScreen,
} from '/navigation/screens/home/Tabs';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { isIOS } from '/helpers/platform';

const Tabs = createMaterialTopTabNavigator();

interface TabIconProps {
  Icon: FC<SvgProps>;
  focused: boolean;
}

export function TabIcon({ Icon, focused }: TabIconProps): JSX.Element {
  return (
    <CenterView flex={1}>
      <Icon
        fill={focused ? theme.colors.SECONDARY_MAIN : theme.colors.WHITE}
        height={screenPercentageToDP(3.03, Orientation.Height)}
      />
    </CenterView>
  );
}

const TabScreenIcon = (Icon: FC<SvgProps>) => (props: {
  focused: boolean;
  color: string;
}): ReactElement => <TabIcon Icon={Icon} {...props} />;

const HomeScreenOptions: MaterialTopTabNavigationOptions = {
  tabBarIcon: TabScreenIcon(HomeBottomLogoIcon),
};
const ReportScreenOptions: MaterialTopTabNavigationOptions = {
  tabBarIcon: TabScreenIcon(BarChartIcon),
};
const SyncDataScreenOptions: MaterialTopTabNavigationOptions = {
  tabBarIcon: TabScreenIcon(SyncDataIcon),
  tabBarLabel: 'Sync Data',
};
const MoreScreenOptions: MaterialTopTabNavigationOptions = {
  tabBarIcon: TabScreenIcon(MoreMenuIcon),
};

const HomeTabBarOptions = {
  activeTintColor: theme.colors.SECONDARY_MAIN,
  inactiveTintColor: theme.colors.WHITE,
  showIcon: true,
  style: {
    justifyContent: 'center',
    height: screenPercentageToDP(8.5, Orientation.Height),
    backgroundColor: theme.colors.PRIMARY_MAIN,
  },
  indicatorStyle: {
    backgroundColor: theme.colors.PRIMARY_MAIN,
  },
  labelStyle: {
    margin: 0,
    padding: 0,
    marginTop: isIOS() ? screenPercentageToDP(0.6, Orientation.Height) : 0,
    fontSize: screenPercentageToDP(1.45, Orientation.Height),
  },
};

const TabNavigator = ({ selectedPatient }: BaseAppProps): ReactElement => {
  return (
    <Tabs.Navigator tabBarPosition="bottom" tabBarOptions={HomeTabBarOptions}>
      <Tabs.Screen
        options={HomeScreenOptions}
        name={Routes.HomeStack.HomeTabs.Home}
        component={selectedPatient ? PatientHome : HomeScreen}
      />
      <Tabs.Screen
        options={ReportScreenOptions}
        name={Routes.HomeStack.HomeTabs.Reports}
        component={ReportScreen}
      />
      <Tabs.Screen
        options={SyncDataScreenOptions}
        name={Routes.HomeStack.HomeTabs.SyncData}
        component={SyncDataScreen}
      />
      <Tabs.Screen
        options={MoreScreenOptions}
        name={Routes.HomeStack.HomeTabs.More}
        component={MoreScreen}
      />
    </Tabs.Navigator>
  );
};

export const HomeTabsStack = compose(withPatient)(TabNavigator);
