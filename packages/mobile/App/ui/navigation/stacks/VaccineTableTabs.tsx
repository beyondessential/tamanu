import React, { ReactElement, useEffect } from 'react';
import Orientation from 'react-native-orientation-locker';
import { Routes } from '/helpers/routes';
import { VaccineHistoryTab } from '../screens/vaccine/tableTabs';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

const Tabs = createTopTabNavigator();

export const VaccineTableTabs = (): ReactElement => {
  useEffect(() => {
    Orientation.unlockAllOrientations();

    return (): void => {
      Orientation.lockToPortrait();
    };
  }, []);

  return (
    <Tabs.Navigator
      tabBarOptions={{
        labelStyle: { textTransform: 'none' },
      }}
      swipeEnabled={false}
    >
      <Tabs.Screen
        options={{
          title: () => (
            <TranslatedText stringId="vaccine.form.category.option.routine" fallback="Routine" />
          ),
        }}
        name={Routes.HomeStack.VaccineStack.VaccineTabs.Routine}
        component={VaccineHistoryTab}
      />
      <Tabs.Screen
        options={{
          title: () => (
            <TranslatedText stringId="vaccine.form.category.option.catchUp" fallback="Catchup" />
          ),
        }}
        name={Routes.HomeStack.VaccineStack.VaccineTabs.Catchup}
        component={VaccineHistoryTab}
      />
      <Tabs.Screen
        options={{
          title: () => (
            <TranslatedText stringId="vaccine.form.category.option.campaign" fallback="Campaign" />
          ),
        }}
        name={Routes.HomeStack.VaccineStack.VaccineTabs.Campaign}
        component={VaccineHistoryTab}
      />
    </Tabs.Navigator>
  );
};
