import React, { type ReactElement } from 'react';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { VaccinesScreen } from '../screens/historyvitals/tabs/VaccinesScreen';
import { VisitsScreen } from '../screens/historyvitals/tabs/VisitsScreen';
import { TopTabNavigator, TopTabScreen } from '/components/TopTabNavigator';
import { Routes } from '/helpers/routes';

export const HistoryVitalsTabs = (): ReactElement => (
  <TopTabNavigator>
    <TopTabScreen
      options={{
        tabBarLabel: () => (
          <TranslatedText stringId="patient.history.visits.title" fallback="Visits" />
        ),
      }}
      name={Routes.HomeStack.HistoryVitalsStack.HistoryVitalsTabs.Visits}
      component={VisitsScreen}
    />
    <TopTabScreen
      options={{
        tabBarLabel: () => (
          <TranslatedText stringId="patient.history.vaccines.title" fallback="Vaccines" />
        ),
      }}
      name={Routes.HomeStack.HistoryVitalsStack.HistoryVitalsTabs.Vaccines}
      component={VaccinesScreen}
    />
  </TopTabNavigator>
);
