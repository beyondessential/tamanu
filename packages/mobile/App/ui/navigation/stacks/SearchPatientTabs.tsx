import React, { ReactElement } from 'react';
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

export const SearchPatientTabs = ({ routingFrom }): ReactElement => {
  const { getTranslation } = useTranslation();

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.PRIMARY_MAIN,
        tabBarInactiveTintColor: theme.colors.TEXT_DARK,
        tabBarLabelStyle: {
          fontSize: 12,
          textTransform: 'none',
        },
        tabBarIndicatorStyle: {
          backgroundColor: theme.colors.PRIMARY_MAIN,
        },
        tabBarStyle: {
          height: 50,
          backgroundColor: theme.colors.WHITE,
        },
      }}
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
