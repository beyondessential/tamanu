import { Routes } from '/helpers/routes';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import React, { ReactElement, useCallback, useMemo } from 'react';
import { useFilterFields } from './hooks';
import { Screen } from './Screen';

const Container = ({ navigation, route }: BaseAppProps): ReactElement => {
  const { onChangeFilters } = route.params;

  const fields = useFilterFields();

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
