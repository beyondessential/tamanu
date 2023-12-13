import { createTopTabNavigator } from '/components/TopTabNavigator';
import { Routes } from '/helpers/routes';
import React, { ReactElement } from 'react';
import { VaccinesScreen } from '../screens/historyvitals/tabs/VaccinesScreen';
import { VisitsScreen } from '../screens/historyvitals/tabs/VisitsScreen';

const Tabs = createTopTabNavigator();

export const HistoryVitalsTabs = (): ReactElement => (
  <Tabs.Navigator swipeEnabled={false}>
    <Tabs.Screen
      options={{
        title: 'VISITS',
      }}
      name={Routes.HomeStack.HistoryVitalsStack.HistoryVitalsTabs.Visits}
      component={VisitsScreen}
    />
    <Tabs.Screen
      options={{
        title: 'VACCINES',
      }}
      name={Routes.HomeStack.HistoryVitalsStack.HistoryVitalsTabs.Vaccines}
      component={VaccinesScreen}
    />
  </Tabs.Navigator>
);
