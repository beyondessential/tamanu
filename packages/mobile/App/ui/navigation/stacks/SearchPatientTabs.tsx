import React, { ReactElement } from 'react';
import { MaterialTopTabBarOptions } from '@react-navigation/material-top-tabs';
// Components
import { RecentViewedScreen, ViewAllScreen } from '../screens/PatientSearch/PatientSearchTabs';
// Helpers
import { theme } from '/styled/theme';
import { Routes } from '/helpers/routes';
// Navigator
import { createSearchPatientNavigator } from '../navigators/SearchPatientTabs';
import { PatientFromRoute } from '~/ui/helpers/constants';
import { useTranslation } from '~/ui/contexts/TranslationContext';

const Tabs = createSearchPatientNavigator();

const SearchPatientTabOptions: MaterialTopTabBarOptions = {
  activeTintColor: theme.colors.PRIMARY_MAIN,
  inactiveTintColor: theme.colors.TEXT_DARK,
  labelStyle: {
    fontSize: 12,
    textTransform: 'none',
  },
  indicatorStyle: {
    backgroundColor: theme.colors.PRIMARY_MAIN,
  },
  style: {
    height: 50,
    backgroundColor: theme.colors.WHITE,
  },
};

export const SearchPatientTabs = ({ routingFrom }): ReactElement => {
  const { getTranslation } = useTranslation();

  return (
    <Tabs.Navigator
      tabBarOptions={SearchPatientTabOptions}
      initialRouteName={
        routingFrom === PatientFromRoute.ALL_PATIENT
          ? Routes.HomeStack.SearchPatientStack.SearchPatientTabs.ViewAll
          : Routes.HomeStack.SearchPatientStack.SearchPatientTabs.RecentViewed
      }
    >
      <Tabs.Screen
        options={{
          tabBarLabel: getTranslation('patient.recentlyViewedTab.title', 'Recently viewed'),
        }}
        name={Routes.HomeStack.SearchPatientStack.SearchPatientTabs.RecentViewed}
        component={RecentViewedScreen}
      />
      <Tabs.Screen
        options={{
          tabBarLabel: getTranslation('patient.allPatient.title', 'All patients'),
        }}
        name={Routes.HomeStack.SearchPatientStack.SearchPatientTabs.ViewAll}
        component={ViewAllScreen}
      />
    </Tabs.Navigator>
  );
};
