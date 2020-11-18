import React, { ReactElement } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { VaccineHistoryTab } from '../screens/vaccine/tableTabs';
import { Routes } from '/helpers/routes';

const Tab = createMaterialTopTabNavigator();

export const VaccineTableTabs = (): ReactElement => (
  <Tab.Navigator>
    <Tab.Screen
      options={{
        title: 'Childhood',
      }}
      name={Routes.HomeStack.VaccineStack.VaccineTabs.ChildhoodTab}
      component={VaccineHistoryTab}
    />
    <Tab.Screen
      options={{
        title: 'Adolescent',
      }}
      name={Routes.HomeStack.VaccineStack.VaccineTabs.AdolescentTab}
      component={VaccineHistoryTab}
    />
    <Tab.Screen
      options={{
        title: 'Adult',
      }}
      name={Routes.HomeStack.VaccineStack.VaccineTabs.AdultTab}
      component={VaccineHistoryTab}
    />
  </Tab.Navigator>
);
