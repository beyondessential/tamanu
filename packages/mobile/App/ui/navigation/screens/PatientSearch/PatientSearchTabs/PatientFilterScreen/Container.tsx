import React from 'react';
import { useClearFilterFields } from './hooks';
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

  const onClearFilters = useClearFilterFields();

  return <Screen onCancel={onNavigateBack} onClear={onClearFilters} onSubmit={onSubmit} />;
};
