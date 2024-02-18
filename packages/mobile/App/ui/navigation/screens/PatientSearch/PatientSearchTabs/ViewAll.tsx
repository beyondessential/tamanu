import React, { FC, ReactElement, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { FindOperator, Like, Raw } from 'typeorm';
import { FieldHelperProps, FieldInputProps, FieldMetaProps, useField } from 'formik';
import { compose } from 'redux';
// Containers
import { withPatient } from '/containers/Patient';
// Components
import { FullView, StyledView } from '/styled/common';
import { PatientSectionList } from '/components/PatientSectionList';
import { LoadingScreen } from '/components/LoadingScreen';
// Helpers
import { Routes } from '/helpers/routes';
import { useBackendEffect } from '~/ui/hooks';
//Props
import { ViewAllScreenProps } from '/interfaces/screens/PatientSearchStack';
import { Button } from '/components/Button';
import { theme } from '/styled/theme';
import { FilterIcon } from '/components/Icons/FilterIcon';
import { useFilterFields } from './PatientFilterScreen';
import { IPatient } from '~/types';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

interface ActiveFilters {
  count: number;
  filters: {
    [key: string]: FindOperator<string> | any;
  };
}

type FieldProp = [FieldInputProps<any>, FieldMetaProps<any>, FieldHelperProps<any>];

const getActiveFilters = (filters: ActiveFilters, filter: FieldProp): ActiveFilters => {
  const field = filter[0];
  const activeFilters = { ...filters };

  if (field.value) {
    activeFilters.count += 1;
    if (field.name === 'sex') {
      if (field.value !== 'all') {
        activeFilters.filters[field.name] = field.value;
      }
    } else if (field.name === 'dateOfBirth') {
      const date = format(field.value, 'yyyy-MM-dd');
      activeFilters.filters[field.name] = date;
    } else if (['firstName', 'lastName'].includes(field.name)) {
      activeFilters.filters[field.name] = {
        where: `${field.name} LIKE :fieldValue`,
        substitutions: { fieldValue: `%${field.value}%` },
      };
    } else if (field.name === 'programRegistryId') {
      activeFilters.filters[field.name] = {
        where: `
          patient.id IN
            (
              SELECT DISTINCT ppr.patientId
              FROM patient_program_registration ppr
              WHERE ( ppr.programRegistryId = :programRegistryId )
              AND ( ppr.deletedAt IS NULL )
            )
        `,
        substitutions: { programRegistryId: field.value },
      };
    } else {
      activeFilters.filters[field.name] = field.value; // use equal for any other filters
    }
  }

  return activeFilters;
};

const applyActiveFilters = (
  models,
  { filters }: ActiveFilters,
  { value: searchValue }: FieldInputProps<any>,
): IPatient[] => {
  const value = searchValue.trim();
  return models.Patient.filterAndSearchPatients(filters, value);
};

const Screen: FC<ViewAllScreenProps> = ({
  navigation,
  setSelectedPatient,
}: ViewAllScreenProps): ReactElement => {
  /** Get Search Input */
  const [searchField] = useField('search');
  // Get filters
  const filterFields = useFilterFields();
  const activeFilters = useMemo(
    () =>
      filterFields.reduce<ActiveFilters>(getActiveFilters, {
        count: 0,
        filters: {},
      }),
    [filterFields],
  );

  const [list, error] = useBackendEffect(
    ({ models }) => applyActiveFilters(models, activeFilters, searchField),
    [searchField.value, activeFilters],
  );

  const onNavigateToPatientHome = useCallback(patient => {
    setSelectedPatient(patient);
    navigation.navigate(Routes.HomeStack.SearchPatientStack.Index, {
      screen: Routes.HomeStack.SearchPatientStack.Index,
    });
  }, []);

  const onNavigateToFilters = useCallback(
    () => navigation.navigate(Routes.HomeStack.SearchPatientStack.FilterSearch),
    [],
  );

  if (!list) {
    return <LoadingScreen />;
  }

  return (
    <FullView>
      <PatientSectionList patients={list} onPressItem={onNavigateToPatientHome} />
      <StyledView position="absolute" zIndex={2} width="100%" alignItems="center" bottom={30}>
        <Button
          width={screenPercentageToDP(60.82, Orientation.Width)}
          backgroundColor={`${theme.colors.MAIN_SUPER_DARK}`}
          bordered
          textColor={theme.colors.WHITE}
          onPress={onNavigateToFilters}
          buttonText={`Filters ${activeFilters.count > 0 ? `${activeFilters.count}` : ''}`}
        >
          <StyledView marginRight={screenPercentageToDP(2.43, Orientation.Width)}>
            <FilterIcon
              fill={activeFilters.count > 0 ? theme.colors.SECONDARY_MAIN : theme.colors.WHITE}
              height={20}
            />
          </StyledView>
        </Button>
      </StyledView>
    </FullView>
  );
};

export const ViewAllScreen = compose(withPatient)(Screen);
