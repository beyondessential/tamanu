import React, { ReactElement } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { VaccineHistoryTab } from '../screens/vaccine/tableTabs';
import { Routes } from '/helpers/routes';

const Tab = createMaterialTopTabNavigator();

export const VaccineTableTabs = (): ReactElement => (
  <Tab.Navigator>
    <Tab.Screen
      options={{
        title: 'Routine',
      }}
      name={Routes.HomeStack.VaccineStack.VaccineTabs.Routine}
      component={VaccineHistoryTab}
    />
    <Tab.Screen
      options={{
        title: 'Catchup',
      }}
      name={Routes.HomeStack.VaccineStack.VaccineTabs.Catchup}
      component={VaccineHistoryTab}
    />
    <Tab.Screen
      options={{
        title: 'Campaign',
      }}
      name={Routes.HomeStack.VaccineStack.VaccineTabs.Campaign}
      component={VaccineHistoryTab}
    />
  </Tab.Navigator>
);
