import React, { FC, ReactElement, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
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

type FieldProp = [FieldInputProps<any>, FieldMetaProps<any>, FieldHelperProps<any>];

type QueryConfig = { where: string; substitutions: {} };

const getQueryConfigForField = (fieldName, fieldValue): QueryConfig => {
  const defaultConfig = {
    where: `patient.${fieldName} = :value`,
    substitutions: {
      value: fieldValue,
    },
  };

  switch (fieldName) {
    case 'sex':
      if (fieldValue === 'all') {
        return null;
      }
      return defaultConfig;
    case 'dateOfBirth':
      return {
        where: `patient.${fieldName} = :value`,
        substitutions: {
          value: format(fieldValue, 'yyyy-MM-dd'),
        },
      };
    case 'firstName':
    case 'lastName':
      return {
        where: `${fieldName} LIKE :fieldValue`,
        substitutions: { fieldValue: `%${fieldValue}%` },
      };
    case 'programRegistryId':
      return {
        where: `
          patient.id IN
            (
              SELECT DISTINCT ppr.patientId
              FROM patient_program_registration ppr
              WHERE ( ppr.programRegistryId = :programRegistryId )
              AND ( ppr.deletedAt IS NULL )
            )
        `,
        substitutions: { programRegistryId: fieldValue },
      };
    default:
      return defaultConfig;
  }
};

const searchAndFilterPatients = async (
  models,
  { value: searchTerm }: FieldInputProps<any>,
  filters: Record<string, string>,
): Promise<IPatient[]> => {
  const searchValue = searchTerm.trim();

  const queryBuilder = models.Patient.getRepository();

  // Add the search term, which can match across any of 5 key fields
  queryBuilder.where(
    `(
      patient.displayId LIKE :search OR
      patient.firstName LIKE :search OR
      patient.middleName LIKE :search OR
      patient.lastName LIKE :search OR
      patient.culturalName LIKE :search
    )`,
    { search: `%${searchValue}%` },
  );

  // Filter patients by any of the specific "advanced"/"per-field" filters the user has specified
  Object.entries(filters).forEach(([fieldName, fieldValue]) => {
    const queryConfig = getQueryConfigForField(fieldName, fieldValue);
    if (!queryConfig) {
      return;
    }
    const { where, substitutions } = queryConfig;
    queryBuilder.andWhere(where, substitutions);
  });

  // Don't return deleted patients
  queryBuilder.andWhere('patient.deletedAt IS NULL');

  queryBuilder.orderBy('patient.lastName', 'ASC');
  queryBuilder.addOrderBy('patient.firstName', 'ASC');
  queryBuilder.limit(100);

  const patients = await queryBuilder.getMany();
  return patients;
};

const Screen: FC<ViewAllScreenProps> = ({
  navigation,
  setSelectedPatient,
}: ViewAllScreenProps): ReactElement => {
  /** Get Search Input */
  const [searchField] = useField('search');

  // Get filters
  const filterFields: FieldProp[] = useFilterFields();

  // Get fields in active use, and transform from formik fields to a simple object
  const activeFilters = useMemo(() => {
    const entries = filterFields
      .filter(field => field[0].value)
      .map(field => [field[0].name, field[0].value]);
    return Object.fromEntries(entries);
  }, [filterFields]);

  const activeFilterCount = Object.keys(activeFilters).length;

  const [list, error] = useBackendEffect(
    ({ models }) => searchAndFilterPatients(models, searchField, activeFilters),
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
          buttonText={`Filters ${activeFilterCount > 0 ? `${activeFilterCount}` : ''}`}
        >
          <StyledView marginRight={screenPercentageToDP(2.43, Orientation.Width)}>
            <FilterIcon
              fill={activeFilterCount > 0 ? theme.colors.SECONDARY_MAIN : theme.colors.WHITE}
              height={20}
            />
          </StyledView>
        </Button>
      </StyledView>
    </FullView>
  );
};

export const ViewAllScreen = compose(withPatient)(Screen);
