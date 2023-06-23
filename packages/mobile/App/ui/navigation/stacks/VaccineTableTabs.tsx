import React, { ReactElement, useEffect } from 'react';
import Orientation from 'react-native-orientation';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Routes } from '/helpers/routes';
import { VaccineHistoryTab } from '../screens/vaccine/tableTabs';

const Tab = createMaterialTopTabNavigator();

export const VaccineTableTabs = (): ReactElement => {
  useEffect(() => {
    Orientation.unlockAllOrientations();

    return (): void => {
      Orientation.lockToPortrait();
    };
  }, []);

  return (
    <Tab.Navigator swipeEnabled={false}>
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
};
