import React, { ReactElement, useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { compose } from 'redux';
import { StackHeader } from '/components/StackHeader';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { withPatient } from '/containers/Patient';
import { IPatient } from '~/types';
import { joinNames } from '/helpers/user';
import { FullView } from '/styled/common';
import { AddIllnessScreen } from '../screens/diagnosisAndTreatment/AddIllnessDetails';
import { PrescribeMedicationScreen } from '../screens/diagnosisAndTreatment/PrescribeMedication';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

const Tabs = createTopTabNavigator();

type DiagnosisAndTreatmentTabsProps = {
  navigation: NavigationProp<any>;
  selectedPatient: IPatient;
};

const TabNavigator = ({
  navigation,
  selectedPatient,
}: DiagnosisAndTreatmentTabsProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);
  return (
    <ErrorBoundary>
      <FullView>
        <StackHeader
          title="Diagnosis & Treatment"
          subtitle={joinNames(selectedPatient)}
          onGoBack={goBack}
        />
        <Tabs.Navigator>
          <Tabs.Screen
            options={{
              title: 'ADD DETAILS',
            }}
            name={Routes.HomeStack.DiagnosisAndTreatmentTabs.AddIllnessScreen}
            component={AddIllnessScreen}
          />
          <Tabs.Screen
            options={{
              title: 'PRESCRIBE MEDICATION',
            }}
            name={Routes.HomeStack.DiagnosisAndTreatmentTabs.PrescribeMedication}
            component={PrescribeMedicationScreen}
          />
        </Tabs.Navigator>
      </FullView>
    </ErrorBoundary>
  );
};

export const DiagnosisAndTreatmentTabs = compose(withPatient)(TabNavigator);
