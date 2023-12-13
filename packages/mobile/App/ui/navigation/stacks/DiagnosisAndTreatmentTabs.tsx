import { StackHeader } from '/components/StackHeader';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { withPatient } from '/containers/Patient';
import { Routes } from '/helpers/routes';
import { joinNames } from '/helpers/user';
import { FullView } from '/styled/common';
import { NavigationProp } from '@react-navigation/native';
import React, { ReactElement, useCallback } from 'react';
import { compose } from 'redux';
import { IPatient } from '~/types';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { AddIllnessScreen } from '../screens/diagnosisAndTreatment/AddIllnessDetails';
import { PrescribeMedicationScreen } from '../screens/diagnosisAndTreatment/PrescribeMedication';

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
              title: 'Add details',
            }}
            name={Routes.HomeStack.DiagnosisAndTreatmentTabs.AddIllnessScreen}
            component={AddIllnessScreen}
          />
          <Tabs.Screen
            options={{
              title: 'Prescribe medication',
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
