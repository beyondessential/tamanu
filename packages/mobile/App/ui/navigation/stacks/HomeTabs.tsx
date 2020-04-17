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
import { BaseAppProps } from '../../interfaces/BaseAppProps';
import { Routes } from '/helpers/routes';
import { BottomNavLogo, BarChart, SyncFiles, More } from '/components/Icons';
import {
  ReportScreen,
  SyncDataScreen,
  MoreScreen,
} from '/navigation/screens/home/Tabs';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

const Tabs = createMaterialTopTabNavigator();

interface TabIconProps {
  Icon: FC<SvgProps>;
  focused: boolean;
}

export function TabIcon({ Icon, focused }: TabIconProps): JSX.Element {
  return (
    <CenterView>
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
  tabBarIcon: TabScreenIcon(BottomNavLogo),
};
const ReportScreenOptions: MaterialTopTabNavigationOptions = {
  tabBarIcon: TabScreenIcon(BarChart),
};
const SyncDataScreenOptions: MaterialTopTabNavigationOptions = {
  tabBarIcon: TabScreenIcon(SyncFiles),
  tabBarLabel: 'Sync Data',
};
const MoreScreenOptions: MaterialTopTabNavigationOptions = {
  tabBarIcon: TabScreenIcon(More),
};

const HomeTabBarOptions = {
  activeTintColor: theme.colors.SECONDARY_MAIN,
  inactiveTintColor: theme.colors.WHITE,
  showIcon: true,
  style: {
    justifyContent: 'center',
    height: screenPercentageToDP(9.72, Orientation.Height),
    maxHeight: 80,
    backgroundColor: theme.colors.PRIMARY_MAIN,
  },
  indicatorStyle: {
    backgroundColor: theme.colors.PRIMARY_MAIN,
  },
  labelStyle: {
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
