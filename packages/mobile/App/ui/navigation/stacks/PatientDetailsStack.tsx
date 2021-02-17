import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '~/ui/helpers/routes';
import { PatientDetailsScreen } from '~/ui/navigation/screens/home/PatientDetails';
import { AddPatientIssueScreen } from '~/ui/navigation/screens/home/PatientDetails/AddPatientIssue';

const Stack = createStackNavigator();

export const PatientDetailsStack = () => {
  return (
    <Stack.Navigator headerMode="none">
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.Index}
        component={PatientDetailsScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.AddPatientIssue}
        component={AddPatientIssueScreen}
      />
    </Stack.Navigator>
  );
};
