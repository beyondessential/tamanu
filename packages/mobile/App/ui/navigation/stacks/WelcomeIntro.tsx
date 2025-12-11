import React, { ReactElement } from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
// Screens
import { Intro } from '../screens/home/Intro';
import { Routes } from '/helpers/routes';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

const Stack = createStackNavigator();

export const WelcomeIntroTabs = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator
      screenOptions={{ headerShown: false, ...TransitionPresets.SlideFromRightIOS }}
    >
      <Stack.Screen
        name="step1"
        component={Intro}
        initialParams={{
          step: 1,
          nextRoute: 'step2',
          title: (
            <TranslatedText
              stringId="welcome.heading.searchForPatients"
              fallback="Search for patients"
            />
          ),
          message: (
            <TranslatedText
              stringId="welcome.message.searchForPatients"
              fallback="All patients in the system are searchable, no internet is required after the first login. Start working immediately."
            />
          ),
        }}
      />
      <Stack.Screen
        name="step2"
        component={Intro}
        initialParams={{
          step: 2,
          nextRoute: 'step3',
          title: (
            <TranslatedText
              stringId="welcome.heading.recordPatientVisits"
              fallback="Record patient visits"
            />
          ),
          message: (
            <TranslatedText
              stringId="welcome.message.recordPatientVisits"
              fallback="Record details from each patient visit, including diagnoses, vitals, medications, immunizations, births, deaths and program information."
            />
          ),
        }}
      />
      <Stack.Screen
        name="step3"
        component={Intro}
        initialParams={{
          step: 3,
          nextRoute: Routes.HomeStack.HomeTabs.Index,
          title: (
            <TranslatedText
              stringId="welcome.heading.syncData"
              fallback="Sync data to the central system"
            />
          ),
          message: (
            <TranslatedText
              stringId="welcome.message.syncData"
              fallback="Entered data will sync to the main system automatically whenever internet is available. You can download existing patient visit data if internet is available."
            />
          ),
        }}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
