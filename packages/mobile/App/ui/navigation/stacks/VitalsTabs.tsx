import type { NavigationProp } from '@react-navigation/native';
import React, { type ReactElement } from 'react';
import type { IPatient } from '~/types';
import { useSelectedPatient } from '~/ui/contexts/SelectedPatientContext';
import { joinNames } from '~/ui/helpers/user';
import { AddVitalsScreen, ViewHistoryScreen } from '../screens/vitals/tabs';
import { StackHeader } from '/components/StackHeader';
import { TopTabNavigator, TopTabScreen } from '/components/TopTabNavigator';
import { TranslatedText } from '/components/Translations/TranslatedText';
import { Routes } from '/helpers/routes';

type NewProgramEntryTabsProps = {
  navigation: NavigationProp<any>;
};

const getPatientName = (patient: IPatient): string => joinNames(patient);

export const VitalsTabs = ({ navigation }: NewProgramEntryTabsProps): ReactElement => {
  const { selectedPatient } = useSelectedPatient();
  return (
    <>
      <StackHeader
        title={<TranslatedText stringId="patient.vitals.title" fallback="Vitals" />}
        subtitle={getPatientName(selectedPatient)}
        onGoBack={navigation.goBack}
      />
      <TopTabNavigator screenOptions={{ lazy: true }}>
        <TopTabScreen
          options={{
            tabBarLabel: () => (
              <TranslatedText stringId="patient.vitals.heading.addVitals" fallback="Add Vitals" />
            ),
          }}
          name={Routes.HomeStack.VitalsStack.VitalsTabs.AddDetails}
          component={AddVitalsScreen}
        />
        <TopTabScreen
          options={{
            tabBarLabel: () => (
              <TranslatedText stringId="patient.vitals.heading.history" fallback="History" />
            ),
          }}
          name={Routes.HomeStack.VitalsStack.VitalsTabs.ViewHistory}
          component={ViewHistoryScreen}
        />
      </TopTabNavigator>
    </>
  );
};
