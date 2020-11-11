import React, { ReactElement, useState } from 'react';
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

const DEFAULT_FILTERS = {
  search: '',
  gender: null,
  age: [0, 99],
  dateOfBirth: null,
  firstName: '',
  lastName: '',
  keywords: '',
  sortBy: null,
  onlyShowText: false,
};

export const SearchPatientStack = (): ReactElement => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const submitPatientFilters = (values): void => {
    setFilters(values);
  };

  return (
    <Formik
      initialValues={filters}
      onSubmit={submitPatientFilters}
    >
      {({ handleSubmit }): ReactElement => (
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
            initialParams={{
              handleSubmit,
            }}
          />
        </Stack.Navigator>
      )}
    </Formik>
  );
};
