import React, { type ReactElement } from 'react';
import type { NavigationProp } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { compose } from 'redux';
import { StackHeader } from '/components/StackHeader';
import { TopTabNavigator, TopTabScreen } from '/components/TopTabNavigator';
import { withPatient } from '/containers/Patient';
import type { IPatient } from '~/types';
import { joinNames } from '/helpers/user';
import { FullView } from '/styled/common';
import { AddIllnessScreen } from '../screens/diagnosisAndTreatment/AddIllnessDetails';
import { PrescribeMedicationScreen } from '../screens/diagnosisAndTreatment/PrescribeMedication';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

type DiagnosisAndTreatmentTabsProps = {
  navigation: NavigationProp<any>;
  selectedPatient: IPatient;
};

const TabNavigator = ({
  navigation,
  selectedPatient,
}: DiagnosisAndTreatmentTabsProps): ReactElement => {
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

export const DiagnosisAndTreatmentTabs = compose(withPatient)(TabNavigator);
