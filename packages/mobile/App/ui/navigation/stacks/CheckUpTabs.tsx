import React, { ReactElement, useCallback, useMemo } from 'react';
import { compose } from 'redux';
import { NavigationProp } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { AddVitalsScreen, ViewHistoryScreen, CreateEncounterForm } from '../screens/checkup/tabs';
import { withPatient } from '~/ui/containers/Patient';
import { IPatient } from '~/types';

const Tabs = createTopTabNavigator();

type NewProgramEntryTabsProps = {
  navigation: NavigationProp<any>;
};

const getPatientName = (
  patient: IPatient
): string => `${patient.culturalName || patient.firstName} ${patient.lastName}`;

const DumbCheckUpTabs = ({
  navigation,
  selectedPatient,
}: NewProgramEntryTabsProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  return (
    <>
      <StackHeader title="Check up" subtitle={getPatientName(selectedPatient)} onGoBack={goBack} />
      <Tabs.Navigator swipeEnabled={false}>
        <Tabs.Screen
          options={{
            title: 'CREATE ENCOUNTER',
          }}
          name={Routes.HomeStack.CheckUpStack.CheckUpTabs.CreateEncounter}
          component={CreateEncounterForm}
        />
        <Tabs.Screen
          options={{
            title: 'Add Details',
          }}
          name={Routes.HomeStack.CheckUpStack.CheckUpTabs.AddDetails}
          component={AddVitalsScreen}
        />
        <Tabs.Screen
          options={{
            title: 'VIEW HISTORY',
          }}
          name={Routes.HomeStack.CheckUpStack.CheckUpTabs.ViewHistory}
          component={ViewHistoryScreen}
        />
      </Tabs.Navigator>
    </>
  );
};

export const CheckUpTabs = compose(withPatient)(DumbCheckUpTabs);
