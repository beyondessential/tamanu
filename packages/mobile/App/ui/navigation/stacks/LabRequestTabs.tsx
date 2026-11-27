import type { NavigationProp } from '@react-navigation/native';
import React, { type ReactElement } from 'react';
import type { IPatient } from '~/types';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useSelectedPatient } from '~/ui/contexts/SelectedPatientContext';
import { joinNames } from '~/ui/helpers/user';
import { AddLabRequestScreen, ViewHistoryScreen } from '../screens/labRequests/tabs';
import { StackHeader } from '/components/StackHeader';
import { TopTabNavigator, TopTabScreen } from '/components/TopTabNavigator';
import { Routes } from '/helpers/routes';

type NewProgramEntryTabsProps = {
  navigation: NavigationProp<any>;
};

const getPatientName = (patient: IPatient): string => joinNames(patient);

export const LabRequestTabs = ({ navigation }: NewProgramEntryTabsProps): ReactElement => {
  const { selectedPatient } = useSelectedPatient();
  return (
    <>
      <StackHeader
        title={<TranslatedText stringId="patient.test.title" fallback="New Test - Lab request" />}
        subtitle={getPatientName(selectedPatient)}
        onGoBack={navigation.goBack}
      />
      <TopTabNavigator screenOptions={{ lazy: true }}>
        <TopTabScreen
          options={{
            tabBarLabel: () => (
              <TranslatedText stringId="patient.test.newTest.title" fallback="New test" />
            ),
          }}
          name={Routes.HomeStack.LabRequestStack.LabRequestTabs.NewRequest}
          component={AddLabRequestScreen}
        />
        <TopTabScreen
          options={{
            tabBarLabel: () => (
              <TranslatedText
                stringId="patient.test.requestHistory.title"
                fallback="Request history"
              />
            ),
          }}
          name={Routes.HomeStack.LabRequestStack.LabRequestTabs.ViewHistory}
          component={ViewHistoryScreen}
        />
      </TopTabNavigator>
    </>
  );
};
