import React, { ReactElement, useEffect } from 'react';
import Orientation from 'react-native-orientation-locker';
import { Routes } from '/helpers/routes';
import { VaccineHistoryTab } from '../screens/vaccine/tableTabs';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { VaccineTableRefreshContext } from '~/ui/components/VaccinesTable';

const Tabs = createTopTabNavigator();

type VaccineTableTabsProps = {
  route: {
    params?: {
      latestAdministeredVaccineId?: string;
    };
  };
};

export const VaccineTableTabs = ({ route }: VaccineTableTabsProps): ReactElement => {
  const { latestAdministeredVaccineId } = route.params ?? {};
  useEffect(() => {
    Orientation.unlockAllOrientations();

    return (): void => {
      Orientation.lockToPortrait();
    };
  }, []);

  return (
    <VaccineTableRefreshContext.Provider value={latestAdministeredVaccineId}>
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { textTransform: 'none' },
      }}
      swipeEnabled={false}
    >
      <Tabs.Screen
        options={{
          tabBarLabel: () => (
            <TranslatedText stringId="vaccine.form.category.option.routine" fallback="Routine" />
          ),
        }}
        name={Routes.HomeStack.VaccineStack.VaccineTabs.Routine}
        component={VaccineHistoryTab}
      />
      <Tabs.Screen
        options={{
          tabBarLabel: () => (
            <TranslatedText stringId="vaccine.form.category.option.catchUp" fallback="Catchup" />
          ),
        }}
        name={Routes.HomeStack.VaccineStack.VaccineTabs.Catchup}
        component={VaccineHistoryTab}
      />
      <Tabs.Screen
        options={{
          tabBarLabel: () => (
            <TranslatedText stringId="vaccine.form.category.option.campaign" fallback="Campaign" />
          ),
        }}
        name={Routes.HomeStack.VaccineStack.VaccineTabs.Campaign}
        component={VaccineHistoryTab}
      />
    </Tabs.Navigator>
    </VaccineTableRefreshContext.Provider>
  );
};
