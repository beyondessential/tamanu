import type { MaterialTopTabNavigationOptions } from '@react-navigation/material-top-tabs';
import React, { useEffect } from 'react';
import Orientation from 'react-native-orientation-locker';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { VaccineHistoryTab } from '../screens/vaccine/tableTabs';
import { TopTabNavigator, TopTabScreen } from '/components/TopTabNavigator';
import { Routes } from '/helpers/routes';

const screenOptions = { swipeEnabled: false } as const satisfies MaterialTopTabNavigationOptions;

export const VaccineTableTabs = () => {
  useEffect(() => {
    Orientation.unlockAllOrientations();
    return () => void Orientation.lockToPortrait();
  }, []);

  return (
    <TopTabNavigator screenOptions={screenOptions}>
      <TopTabScreen
        options={{
          tabBarLabel: () => (
            <TranslatedText stringId="vaccine.form.category.option.routine" fallback="Routine" />
          ),
        }}
        name={Routes.HomeStack.VaccineStack.VaccineTabs.Routine}
        component={VaccineHistoryTab}
      />
      <TopTabScreen
        options={{
          tabBarLabel: () => (
            <TranslatedText stringId="vaccine.form.category.option.catchUp" fallback="Catchup" />
          ),
        }}
        name={Routes.HomeStack.VaccineStack.VaccineTabs.Catchup}
        component={VaccineHistoryTab}
      />
      <TopTabScreen
        options={{
          tabBarLabel: () => (
            <TranslatedText stringId="vaccine.form.category.option.campaign" fallback="Campaign" />
          ),
        }}
        name={Routes.HomeStack.VaccineStack.VaccineTabs.Campaign}
        component={VaccineHistoryTab}
      />
    </TopTabNavigator>
  );
};
