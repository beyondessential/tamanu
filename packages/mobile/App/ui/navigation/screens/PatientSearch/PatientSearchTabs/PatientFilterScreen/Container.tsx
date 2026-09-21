import React, { type ReactElement, useCallback } from 'react';
import { Screen } from './Screen';
import { Routes } from '/helpers/routes';
import type { BaseAppProps } from '/interfaces/BaseAppProps';
import { useFilterFields } from './hooks';

const Container = ({ navigation, route }: BaseAppProps): ReactElement => {
  const { onChangeFilters } = route.params;

  const [sex, dateOfBirth, firstName, lastName, villageId, programRegistryId] = useFilterFields();

  const onNavigateBack = useCallback(() => {
    navigation.navigate(Routes.HomeStack.SearchPatientStack.SearchPatientTabs.Index);
  }, [navigation]);

  const onSubmit = useCallback(() => {
    onChangeFilters();
    navigation.navigate(Routes.HomeStack.SearchPatientStack.SearchPatientTabs.Index, {
      screen: Routes.HomeStack.SearchPatientStack.SearchPatientTabs.ViewAll,
    });
  }, [navigation, onChangeFilters]);

  const onClearFilters = useCallback(() => {
    sex[2].setValue('');
    dateOfBirth[2].setValue(null);
    firstName[2].setValue('');
    lastName[2].setValue('');
    villageId[2].setValue(null);
    programRegistryId[2].setValue(null);
  }, [sex, dateOfBirth, firstName, lastName, villageId, programRegistryId]);

  return <Screen onCancel={onNavigateBack} onClear={onClearFilters} onSubmit={onSubmit} />;
};

export const PatientFilterScreen = Container;
