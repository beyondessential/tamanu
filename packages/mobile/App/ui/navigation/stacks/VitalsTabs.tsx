import { StackHeader } from '/components/StackHeader';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { Routes } from '/helpers/routes';
import { NavigationProp } from '@react-navigation/native';
import React, { ReactElement, useCallback } from 'react';
import { compose } from 'redux';
import { IPatient } from '~/types';
import { withPatient } from '~/ui/containers/Patient';
import { joinNames } from '~/ui/helpers/user';
import { AddVitalsScreen, ViewHistoryScreen } from '../screens/vitals/tabs';

const Tabs = createTopTabNavigator();

type NewProgramEntryTabsProps = {
  navigation: NavigationProp<any>;
  selectedPatient: IPatient;
};

const getPatientName = (patient: IPatient): string => joinNames(patient);

const DumbVitalsTabs = ({
  navigation,
  selectedPatient,
}: NewProgramEntryTabsProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  return (
    <>
      <StackHeader title="Vitals" subtitle={getPatientName(selectedPatient)} onGoBack={goBack} />
      <Tabs.Navigator swipeEnabled={false} lazy>
        <Tabs.Screen
          options={{
            title: 'Add Vitals',
          }}
          name={Routes.HomeStack.VitalsStack.VitalsTabs.AddDetails}
          component={AddVitalsScreen}
        />
        <Tabs.Screen
          options={{
            title: 'History',
          }}
          name={Routes.HomeStack.VitalsStack.VitalsTabs.ViewHistory}
          component={ViewHistoryScreen}
        />
      </Tabs.Navigator>
    </>
  );
};

export const VitalsTabs = compose(withPatient)(DumbVitalsTabs);
