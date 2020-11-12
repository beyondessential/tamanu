import React, { useCallback, ReactElement } from 'react';
import { useField } from 'formik';
import { Screen } from './Screen';
import { Routes } from '/helpers/routes';
import { BaseAppProps } from '/interfaces/BaseAppProps';

export const FilterArray = [
  'sex',
  'dateOfBirth',
  'firstName',
  'lastName',
];

const Container = ({ navigation, route }: BaseAppProps): ReactElement => {
  const { onChangeFilters } = route.params;
  const fields = FilterArray.map(filterName => useField(filterName));
  const onNavigateBack = useCallback(() => {
    navigation.navigate(
      Routes.HomeStack.SearchPatientStack.SearchPatientTabs.Index,
    );
  }, []);

  const onClearFilters = useCallback(() => {
    fields.forEach(fieldData => {
      const field = fieldData[0];
      const helpers = fieldData[2];
      switch (field.name) {
        case 'age':
          helpers.setValue([0, 99]);
          break;
        default:
          if (typeof field.value === 'string') {
            helpers.setValue('');
          } else {
            helpers.setValue(null);
          }
          break;
      }
    });
  }, []);

  return (
    <Screen
      onCancel={onNavigateBack}
      onSubmit={onChangeFilters}
      onClear={onClearFilters}
    />
  );
};

export const PatientFilterScreen = Container;
