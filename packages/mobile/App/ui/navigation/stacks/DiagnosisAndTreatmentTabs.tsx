import type { NavigationProp } from '@react-navigation/native';
import React, { type ReactElement } from 'react';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { AddIllnessScreen } from '../screens/diagnosisAndTreatment/AddIllnessDetails';
import { PrescribeMedicationScreen } from '../screens/diagnosisAndTreatment/PrescribeMedication';
import { StackHeader } from '/components/StackHeader';
import { TopTabNavigator, TopTabScreen } from '/components/TopTabNavigator';
import { useSelectedPatient } from '~/ui/contexts/SelectedPatientContext';
import { Routes } from '/helpers/routes';
import { joinNames } from '/helpers/user';
import { FullView } from '/styled/common';

type DiagnosisAndTreatmentTabsProps = {
  navigation: NavigationProp<any>;
};

export const DiagnosisAndTreatmentTabs = ({
  navigation,
}: DiagnosisAndTreatmentTabsProps): ReactElement => {
  const { selectedPatient } = useSelectedPatient();
  return (
    <ErrorBoundary>
      <FullView>
        <StackHeader
          title={
            <TranslatedText
              stringId="patient.diagnosisAndTreatment.title"
              fallback="Diagnosis & Treatment"
            />
          }
          subtitle={joinNames(selectedPatient)}
          onGoBack={navigation.goBack}
        />
        <TopTabNavigator>
          <TopTabScreen
            options={{
              tabBarLabel: () => (
                <TranslatedText
                  stringId="patient.diagnosisAndTreatment.heading.addDetails"
                  fallback="Add details"
                />
              ),
            }}
            name={Routes.HomeStack.DiagnosisAndTreatmentTabs.AddIllnessScreen}
            component={AddIllnessScreen}
          />
          <TopTabScreen
            options={{
              tabBarLabel: () => (
                <TranslatedText
                  stringId="patient.diagnosisAndTreatment.heading.prescribeMedication"
                  fallback="Prescribe medication"
                />
              ),
            }}
            name={Routes.HomeStack.DiagnosisAndTreatmentTabs.PrescribeMedication}
            component={PrescribeMedicationScreen}
          />
        </TopTabNavigator>
      </FullView>
    </ErrorBoundary>
  );
};
