import React, { ReactElement, useContext } from 'react';
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
import AuthContext from '../../contexts/authContext/AuthContext';
import { useBackendEffect } from '~/ui/helpers/hooks';

const Stack = createStackNavigator();

export const HomeStack = (): ReactElement => {
  const authCtx = useContext(AuthContext);
  const [vaccines, error] = useBackendEffect(({ models }) => models.Vaccine.find({}));
  console.log(vaccines);
  return (
    <Stack.Navigator
      headerMode="none"
      screenOptions={noSwipeGestureOnNavigator}
      initialRouteName={
        authCtx.checkFirstSession()
          ? Routes.HomeStack.WelcomeIntroStack
          : Routes.HomeStack.HomeTabs.name
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
        name={Routes.HomeStack.CheckUpStack.name}
        component={CheckUpStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.ProgramStack.name}
        component={ProgramStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.VaccineStack.name}
        component={VaccineStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.HomeTabs.name}
        component={HomeTabsStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.ExportDataScreen}
        component={ExportDataScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.RegisterPatientStack.name}
        component={RegisterPatientStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientDetails}
        component={PatientDetailsScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.HistoryVitalsStack.name}
        component={HistoryVitalsStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientActions}
        component={PatientActionsScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.SearchPatientStack.name}
        component={SearchPatientStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.SickOrInjuredTabs.name}
        component={SickOrInjuredTabs}
      />
      <Stack.Screen
        name={Routes.HomeStack.ReferralTabs.name}
        component={ReferralTabs}
      />
      <Stack.Screen
        name={Routes.HomeStack.DeceasedStack.name}
        component={DeceasedStack}
      />
    </Stack.Navigator>
  );
};
