import React, { type ReactElement } from 'react';
import { Routes } from '/helpers/routes';
import { TopTabNavigator, TopTabScreen } from '/components/TopTabNavigator';
import { VisitsScreen } from '../screens/historyvitals/tabs/VisitsScreen';
import { VaccinesScreen } from '../screens/historyvitals/tabs/VaccinesScreen';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

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
