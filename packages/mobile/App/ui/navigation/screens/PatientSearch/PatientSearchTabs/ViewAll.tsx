import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { type FieldHelperProps, type FieldInputProps, type FieldMetaProps, useField } from 'formik';
import React, { type FC, type ReactElement, useMemo } from 'react';
import { compose } from 'redux';
import { RegistrationStatus } from '~/constants/programRegistries';
import { Database } from '~/infra/db';
import type { IPatient } from '~/types';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { PatientFromRoute } from '~/ui/helpers/constants';
import { patientListKeys } from '~/ui/hooks/queries/queryKeys';
import useDebouncedValue from '~/ui/hooks/useDebouncedValue';
import { useFilterFields } from './PatientFilterScreen';
import { Button } from '/components/Button';
import { FilterIcon } from '/components/Icons/FilterIcon';
import { LoadingScreen } from '/components/LoadingScreen';
import { PatientSectionList } from '/components/PatientSectionList';
import { withPatient } from '/containers/Patient';
import { Routes } from '/helpers/routes';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import type { ViewAllScreenProps } from '/interfaces/Screens/PatientSearchStack/ViewAllScreenProps';
import { FullView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';

type FieldProp = [FieldInputProps<any>, FieldMetaProps<any>, FieldHelperProps<any>];

type PatientFilterField =
  | 'dateOfBirth'
  | 'firstName'
  | 'lastName'
  | 'programRegistryId'
  | 'sex'
  | 'villageId';

interface QueryConfig {
  where: string;
  substitutions: {
    [key: string]: unknown;
  };
}

const getQueryConfigForField = (
  fieldName: PatientFilterField,
  fieldValue: unknown,
): QueryConfig => {
  const defaultConfig = {
    where: `patient.${fieldName} = :${fieldName}`,
    substitutions: {
      [fieldName]: fieldValue,
    },
  } as const satisfies QueryConfig;

  switch (fieldName) {
    case 'sex':
      if (fieldValue === 'all') {
        return null;
      }
      return defaultConfig;
    case 'dateOfBirth':
      return {
        where: `patient.${fieldName} = :${fieldName}`,
        substitutions: {
          [fieldName]: format(fieldValue as Date, 'yyyy-MM-dd'),
        },
      };
    case 'firstName':
    case 'lastName':
      return {
        where: `${fieldName} LIKE :${fieldName}`,
        substitutions: { [fieldName]: `%${fieldValue}%` },
      };
    case 'programRegistryId':
      return {
        where: `
          patient.id IN
            (
              SELECT DISTINCT ppr.patientId
              FROM patient_program_registrations ppr
              WHERE ppr.programRegistryId = :programRegistryId
              AND ppr.registrationStatus = :active
              AND ppr.deletedAt IS NULL
            )
        `,
        substitutions: { programRegistryId: fieldValue, active: RegistrationStatus.Active },
      };
    default:
      return defaultConfig;
  }
};

const searchAndFilterPatients = async (
  searchTerm: string,
  filters: Partial<Record<PatientFilterField, string | Date>>,
): Promise<IPatient[]> => {
  const queryBuilder = Database.models.Patient.getRepository().createQueryBuilder('patient');

  queryBuilder.leftJoinAndSelect('patient.village', 'referenceData');

  // Add the search term, which can match across any of 5 key fields
  queryBuilder.where(
    `(
      patient.displayId LIKE :search OR
      patient.firstName LIKE :search OR
      patient.middleName LIKE :search OR
      patient.lastName LIKE :search OR
      patient.culturalName LIKE :search
    )`,
    { search: `%${searchTerm}%` },
  );

  // Filter patients by any of the specific "advanced"/"per-field" filters the user has specified
  for (const [fieldName, fieldValue] of Object.entries(filters) as [
    PatientFilterField,
    string | Date,
  ][]) {
    const queryConfig = getQueryConfigForField(fieldName, fieldValue);
    if (!queryConfig) continue;
    const { where, substitutions } = queryConfig;
    queryBuilder.andWhere(where, substitutions);
  }

  // Don't return deleted patients
  queryBuilder.andWhere('patient.deletedAt IS NULL');

  // Order and limit
  queryBuilder.orderBy('patient.lastName', 'ASC');
  queryBuilder.addOrderBy('patient.firstName', 'ASC');
  queryBuilder.limit(25);

  const patients = await queryBuilder.getMany();
  // Patient and IPatient disagree on village.visibilityStatus (string vs enum), a
  // pre-existing model typing quirk.
  return patients as unknown as IPatient[];
};

const Screen: FC<ViewAllScreenProps> = ({
  navigation,
  setSelectedPatient,
}: ViewAllScreenProps): ReactElement => {
  /** Get Search Input */
  const [searchField] = useField<string>('search');
  const query = useDebouncedValue(searchField.value.trim(), 300);

  // Get filters
  const filterFields: readonly FieldProp[] = useFilterFields();

  // Get fields in active use, and transform from formik fields to a simple object
  const [activeFilters, activeFilterCount] = useMemo(() => {
    const entries = filterFields
      .filter(field => field[0].value)
      .map(field => [field[0].name, field[0].value]);
    return [Object.fromEntries(entries), entries.length];
  }, [filterFields]);

  const { data: list } = useQuery({
    queryKey: patientListKeys.search({ query, filters: activeFilters }),
    queryFn: () => searchAndFilterPatients(query, activeFilters),
  });

  if (!list) return <LoadingScreen />;

  const onNavigateToPatientHome = patient => {
    setSelectedPatient(patient);
    navigation.navigate(Routes.HomeStack.SearchPatientStack.Index, {
      screen: Routes.HomeStack.SearchPatientStack.Index,
      from: PatientFromRoute.ALL_PATIENT,
    });
  };

  const onNavigateToFilters = () =>
    void navigation.navigate(Routes.HomeStack.SearchPatientStack.FilterSearch);

  return (
    <FullView>
      <PatientSectionList patients={list} onPressItem={onNavigateToPatientHome} />
      <StyledView position="absolute" zIndex={2} width="100%" alignItems="center" bottom={30}>
        <Button
          width={screenPercentageToDP(60.82, Orientation.Width)}
          backgroundColor={theme.colors.MAIN_SUPER_DARK}
          bordered
          textColor={theme.colors.WHITE}
          onPress={onNavigateToFilters}
          buttonText={
            <>
              <TranslatedText stringId="patient.search.filters" fallback="Filters" />
              {activeFilterCount > 0 && <> ({activeFilterCount.toLocaleString()})</>}
            </>
          }
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
