import React, { useCallback, ReactElement } from 'react';
import { useField } from 'formik';
import { Screen } from './Screen';
import { Routes } from '/helpers/routes';
import { BaseAppProps } from '../../../../../interfaces/BaseAppProps';

export const FilterArray = [
  'gender',
  'age',
  'dateOfBirth',
  'firstName',
  'lastName',
  'keywords',
  'sortBy',
  'onlyShowText',
];

const Container = ({ navigation }: BaseAppProps): ReactElement => {
  const fields = FilterArray.map(filterName => useField(filterName));
  const onNavigateBack = useCallback(() => {
    navigation.navigate(
      Routes.HomeStack.SearchPatientStack.SearchPatientTabs.name,
    );
  }, []);

  const onSubmitFilters = useCallback(() => {
    navigation.navigate(
      Routes.HomeStack.SearchPatientStack.SearchPatientTabs.name,
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
      onSubmit={onSubmitFilters}
      onClear={onClearFilters}
    />
  );
};

export const PatientFilterScreen = Container;
