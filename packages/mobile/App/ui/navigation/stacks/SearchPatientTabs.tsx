import React, { ReactElement } from 'react';
import { MaterialTopTabBarOptions } from '@react-navigation/material-top-tabs';
// Components
import {
  RecentViewedScreen,
  ViewAllScreen,
} from '../screens/PatientSearch/PatientSearchTabs';
// Helpers
import { theme } from '/styled/theme';
import { Routes } from '/helpers/routes';
// Navigator
import { createSearchPatientNavigator } from '../navigators/SearchPatientTabs';

const Tabs = createSearchPatientNavigator();

const SearchPatientTabOptions: MaterialTopTabBarOptions = {
  activeTintColor: theme.colors.PRIMARY_MAIN,
  inactiveTintColor: theme.colors.TEXT_DARK,
  labelStyle: {
    fontSize: 12,
  },
  indicatorStyle: {
    backgroundColor: theme.colors.PRIMARY_MAIN,
  },
  style: {
    height: 50,
    backgroundColor: theme.colors.WHITE,
  },
};

export const SearchPatientTabs = ({ route }): ReactElement => (
  <Tabs.Navigator tabBarOptions={SearchPatientTabOptions}>
    <Tabs.Screen
      options={{
        tabBarLabel: 'RECENTLY VIEWED PATIENTS',
      }}
      name={Routes.HomeStack.SearchPatientStack.SearchPatientTabs.RecentViewed}
      component={RecentViewedScreen}
    />
    <Tabs.Screen
      options={{
        tabBarLabel: 'VIEW ALL PATIENTS',
      }}
      name={Routes.HomeStack.SearchPatientStack.SearchPatientTabs.ViewAll}
      component={ViewAllScreen}
    />
  </Tabs.Navigator>
);
