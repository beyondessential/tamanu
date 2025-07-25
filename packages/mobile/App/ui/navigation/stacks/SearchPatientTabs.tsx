import React, { ReactElement } from 'react';
// Components
import { RecentViewedScreen, ViewAllScreen } from '../screens/PatientSearch/PatientSearchTabs';
// Helpers
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
      initialRouteName={
        routingFrom === PatientFromRoute.ALL_PATIENT
          ? Routes.HomeStack.SearchPatientStack.SearchPatientTabs.ViewAll
          : Routes.HomeStack.SearchPatientStack.SearchPatientTabs.RecentViewed
      }
    >
      <Tabs.Screen
        options={{
          tabBarLabel: getTranslation('patient.recentlyViewed.title', 'Recently viewed'),
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
