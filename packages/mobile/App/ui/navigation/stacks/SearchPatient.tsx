import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Formik } from 'formik';
// Helpers
import { Routes } from '/helpers/routes';
import { noSwipeGestureOnNavigator } from '/helpers/navigators';
// Navigator
import { SearchPatientTabs } from './SearchPatientTabs';
// Screens
import { PatientFilterScreen } from '../screens/PatientSearch';

const Stack = createStackNavigator();

export const SearchPatientStack = (): ReactElement => (
  <Formik
    initialValues={{
      search: '',
      gender: null,
      age: [0, 99],
      dateOfBirth: null,
      firstName: '',
      lastName: '',
      keywords: '',
      sortBy: null,
      onlyShowText: false,
    }}
    onSubmit={(): void => console.log()}
  >
    <Stack.Navigator
      headerMode="none"
      screenOptions={noSwipeGestureOnNavigator}
    >
      <Stack.Screen
        name={Routes.HomeStack.SearchPatientStack.SearchPatientTabs.Index}
        component={SearchPatientTabs}
      />
      <Stack.Screen
        name={Routes.HomeStack.SearchPatientStack.FilterSearch}
        component={PatientFilterScreen}
      />
    </Stack.Navigator>
  </Formik>
);
