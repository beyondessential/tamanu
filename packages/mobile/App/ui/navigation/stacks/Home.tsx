import React, { ReactElement } from 'react';
// Navigators
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
// Components
import { WelcomeIntroTabs } from './WelcomeIntro';
import { HomeTabsStack } from './HomeTabs';
// Stacks
import { SearchPatientStack } from './SearchPatient';
import { VaccineStack } from './VaccineStack';
import { ProgramStack } from './ProgramStack';
import { VitalsStack } from './VitalsStack';
import { DiagnosisAndTreatmentTabs } from './DiagnosisAndTreatmentTabs';
import { ReferralStack } from './ReferralStack';
import { HistoryVitalsStack } from './HistoryVitalsStack';
import { ExportDataScreen } from '../screens/home/ExportDataScreen';
import { LabRequestStack } from './LabRequestStack';
// Helpers
import { noSwipeGestureOnNavigator } from '/helpers/navigators';
import { Routes } from '/helpers/routes';
import { RegisterPatientStack } from './RegisterPatientStack';
import { PatientDetailsStack } from './PatientDetailsStack';
import { useAuth } from '~/ui/contexts/AuthContext';
import { PatientProgramRegistryFormStack } from './PatientProgramRegistryFormStack';
import { PatientProgramRegistryDetailsStack } from './PatientProgramRegistryDetailsStack';
import { PatientSummaryStack } from './PatientSummaryStack';

const Stack = createStackNavigator();

export const HomeStack = (): ReactElement => {
  const authCtx = useAuth();

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
      <Stack.Screen name={Routes.HomeStack.VitalsStack.Index} component={VitalsStack} />
      <Stack.Screen name={Routes.HomeStack.ProgramStack.Index} component={ProgramStack} />
      <Stack.Screen name={Routes.HomeStack.VaccineStack.Index} component={VaccineStack} />
      <Stack.Screen name={Routes.HomeStack.HomeTabs.Index} component={HomeTabsStack} />
      <Stack.Screen name={Routes.HomeStack.ExportDataScreen} component={ExportDataScreen} />
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
        name={Routes.HomeStack.PatientSummaryStack.Index}
        component={PatientSummaryStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientProgramRegistryFormStack.Index}
        component={PatientProgramRegistryFormStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientProgramRegistryDetailsStack.Index}
        component={PatientProgramRegistryDetailsStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.SearchPatientStack.Index}
        component={SearchPatientStack}
      />
      <Stack.Screen
        name={Routes.HomeStack.DiagnosisAndTreatmentTabs.Index}
        component={DiagnosisAndTreatmentTabs}
      />
      <Stack.Screen name={Routes.HomeStack.ReferralStack.Index} component={ReferralStack} />
      <Stack.Screen name={Routes.HomeStack.LabRequestStack.Index} component={LabRequestStack} />
    </Stack.Navigator>
  );
};
