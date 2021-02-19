import React, { ReactElement, useContext, useEffect } from 'react';
// Navigators
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
// Components
import { WelcomeIntroTabs } from './WelcomeIntro';
import { HomeTabsStack } from './HomeTabs';
import { PatientDetailsScreen } from '../screens/home/PatientDetails';
// Stacks
import { SearchPatientStack } from './SearchPatient';
import { VaccineStack } from './VaccineStack';
import { ProgramStack } from './ProgramStack';
import { CheckUpStack } from './CheckUpStack';
import { SickOrInjuredTabs } from './SickInjuredTabs';
import { ReferralTabs } from './ReferralTabs';
import { DeceasedStack } from './DeceasedStack';
import { PatientActionsScreen } from '../screens/patientActions';
import { HistoryVitalsStack } from './HistoryVitalsStack';
import { ExportDataScreen } from '../screens/home/ExportDataScreen';
// Helpers
import { noSwipeGestureOnNavigator } from '/helpers/navigators';
import { Routes } from '/helpers/routes';
import { RegisterPatientStack } from './RegisterPatientStack';
import { PatientDetailsStack } from './PatientDetailsStack';
import AuthContext from '~/ui/contexts/AuthContext';
import { wrapComponentInErrorBoundary } from '~/ui/components/ErrorBoundary';

const Stack = createStackNavigator();

export const HomeStack = ({ navigator: Navi }): ReactElement => {
  const authCtx = useContext(AuthContext);

  return (
    <Stack.Navigator
      headerMode="none"
      screenOptions={noSwipeGestureOnNavigator}
      initialRouteName={
        authCtx.checkFirstSession()
          ? Routes.HomeStack.WelcomeIntroStack
          : Routes.HomeStack.HomeTabs.Index
      }
    >
      <Stack.Screen
        name={Routes.HomeStack.WelcomeIntroStack}
        component={WelcomeIntroTabs}
        options={{
          ...TransitionPresets.SlideFromRightIOS,
        }}
      />
      <Stack.Screen
        name={Routes.HomeStack.CheckUpStack.Index}
        component={CheckUpStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.ProgramStack.Index}
        component={ProgramStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.VaccineStack.Index}
        component={VaccineStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.HomeTabs.Index}
        component={HomeTabsStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.ExportDataScreen}
        component={wrapComponentInErrorBoundary(ExportDataScreen)}
      />
      <Stack.Screen
        name={Routes.HomeStack.RegisterPatientStack.Index}
        component={RegisterPatientStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.Index}
        component={PatientDetailsStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.HistoryVitalsStack.Index}
        component={HistoryVitalsStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientActions}
        component={wrapComponentInErrorBoundary(PatientActionsScreen)}
      />
      <Stack.Screen
        name={Routes.HomeStack.SearchPatientStack.Index}
        component={SearchPatientStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.SickOrInjuredTabs.Index}
        component={SickOrInjuredTabs}
      />
      <Stack.Screen
        name={Routes.HomeStack.ReferralTabs.Index}
        component={ReferralTabs}
      />
      <Stack.Screen
        name={Routes.HomeStack.DeceasedStack.Index}
        component={DeceasedStack}
      />
    </Stack.Navigator>
  );
};
