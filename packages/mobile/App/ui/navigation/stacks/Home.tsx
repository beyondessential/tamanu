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
        component={wrapComponentInErrorBoundary(WelcomeIntroTabs)}
        options={{
          ...TransitionPresets.SlideFromRightIOS,
        }}
      />
      <Stack.Screen
        name={Routes.HomeStack.CheckUpStack.Index}
        component={wrapComponentInErrorBoundary(CheckUpStack)}
      />
      <Stack.Screen
        name={Routes.HomeStack.ProgramStack.Index}
        component={wrapComponentInErrorBoundary(ProgramStack)}
      />
      <Stack.Screen
        name={Routes.HomeStack.VaccineStack.Index}
        component={wrapComponentInErrorBoundary(VaccineStack)}
      />
      <Stack.Screen
        name={Routes.HomeStack.HomeTabs.Index}
        component={wrapComponentInErrorBoundary(HomeTabsStack)}
      />
      <Stack.Screen
        name={Routes.HomeStack.ExportDataScreen}
        component={wrapComponentInErrorBoundary(ExportDataScreen)}
      />
      <Stack.Screen
        name={Routes.HomeStack.RegisterPatientStack.Index}
        component={wrapComponentInErrorBoundary(RegisterPatientStack)}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientDetails}
        component={wrapComponentInErrorBoundary(PatientDetailsScreen)}
      />
      <Stack.Screen
        name={Routes.HomeStack.HistoryVitalsStack.Index}
        component={wrapComponentInErrorBoundary(HistoryVitalsStack)}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientActions}
        component={wrapComponentInErrorBoundary(PatientActionsScreen)}
      />
      <Stack.Screen
        name={Routes.HomeStack.SearchPatientStack.Index}
        component={wrapComponentInErrorBoundary(SearchPatientStack)}
      />
      <Stack.Screen
        name={Routes.HomeStack.SickOrInjuredTabs.Index}
        component={wrapComponentInErrorBoundary(SickOrInjuredTabs)}
      />
      <Stack.Screen
        name={Routes.HomeStack.ReferralTabs.Index}
        component={wrapComponentInErrorBoundary(ReferralTabs)}
      />
      <Stack.Screen
        name={Routes.HomeStack.DeceasedStack.Index}
        component={wrapComponentInErrorBoundary(DeceasedStack)}
      />
    </Stack.Navigator>
  );
};
