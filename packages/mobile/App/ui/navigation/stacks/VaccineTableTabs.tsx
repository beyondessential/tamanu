import React, { ReactElement, useContext, useEffect } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Routes } from '/helpers/routes';
import { OrientationContext } from '/contexts/OrientationContext';
import { VaccineHistoryTab } from '../screens/vaccine/tableTabs';

const Tab = createMaterialTopTabNavigator();

export const VaccineTableTabs = (): ReactElement => {
  const orientationCtx = useContext(OrientationContext);
  useEffect(() => {
    orientationCtx.orientation.unlockAllOrientations();

    return (): void => {
      orientationCtx.orientation.lockToPortrait();
    };
  }, []);

  return (
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
};
