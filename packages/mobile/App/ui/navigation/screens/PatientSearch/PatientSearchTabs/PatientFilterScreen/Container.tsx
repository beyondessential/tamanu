import React from 'react';
import { useFilterFields } from './hooks';
import { Screen } from './Screen';
import { Routes } from '/helpers/routes';
import type { BaseAppProps } from '/interfaces/BaseAppProps';

export const PatientFilterScreen = ({ navigation, route }: BaseAppProps) => {
  const { onChangeFilters } = route.params;

  const onNavigateBack = () => {
    navigation.navigate(Routes.HomeStack.SearchPatientStack.SearchPatientTabs.Index);
  };

  const onSubmit = () => {
    onChangeFilters();
    navigation.navigate(Routes.HomeStack.SearchPatientStack.SearchPatientTabs.Index, {
      screen: Routes.HomeStack.SearchPatientStack.SearchPatientTabs.ViewAll,
    });
  };

  const [sex, dateOfBirth, firstName, lastName, villageId, programRegistryId] = useFilterFields();
  const onClearFilters = () => {
    sex[2].setValue('');
    dateOfBirth[2].setValue(null);
    firstName[2].setValue('');
    lastName[2].setValue('');
    villageId[2].setValue(null);
    programRegistryId[2].setValue(null);
  };

  return <Screen onCancel={onNavigateBack} onClear={onClearFilters} onSubmit={onSubmit} />;
};
