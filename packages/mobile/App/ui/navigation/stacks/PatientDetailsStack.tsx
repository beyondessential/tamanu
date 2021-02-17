import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '~/ui/helpers/routes';
import { PatientDetailsScreen } from '~/ui/navigation/screens/home/PatientDetails';

const Stack = createStackNavigator();

export const PatientDetailsStack = () => {
  return (
    <Stack.Navigator headerMode="none">
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.Index}
        component={PatientDetailsScreen}
      />
    </Stack.Navigator>
  );
};
