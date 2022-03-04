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
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

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

export const SearchPatientStack = ({ navigation }): ReactElement => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const submitPatientFilters = (values): void => {
    navigation.navigate(
      Routes.HomeStack.SearchPatientStack.SearchPatientTabs.Index,
    );
    setFilters(values);
  };

  return (
    <ErrorBoundary>
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
              initialParams={filters}
            />
            <Stack.Screen
              name={Routes.HomeStack.SearchPatientStack.FilterSearch}
              component={PatientFilterScreen}
              initialParams={{
                onChangeFilters: handleSubmit,
              }}
            />
          </Stack.Navigator>
        )}
      </Formik>
    </ErrorBoundary>
  );
};
