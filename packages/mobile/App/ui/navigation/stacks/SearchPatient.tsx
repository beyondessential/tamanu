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

export const SearchPatientStack = ({ navigation, route }): ReactElement => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const routingFrom = route?.params?.params?.from;

  const submitPatientFilters = (values): void => {
    navigation.navigate(Routes.HomeStack.SearchPatientStack.SearchPatientTabs.Index);
    setFilters(values);
  };

  return (
    <ErrorBoundary>
      <Formik initialValues={filters} onSubmit={submitPatientFilters}>
        {({ handleSubmit }): ReactElement => (
          <Stack.Navigator screenOptions={{ ...noSwipeGestureOnNavigator, headerShown: false }}>
            <Stack.Screen
              name={Routes.HomeStack.SearchPatientStack.SearchPatientTabs.Index}
              initialParams={filters}
            >
              {props => <SearchPatientTabs {...props} routingFrom={routingFrom} />}
            </Stack.Screen>
            <Stack.Screen
              name={Routes.HomeStack.SearchPatientStack.FilterSearch}
              component={PatientFilterScreen}
              initialParams={{
                onChangeFilters: handleSubmit,
                hideTabBar: true,
              }}
            />
          </Stack.Navigator>
        )}
      </Formik>
    </ErrorBoundary>
  );
};
