import React, { ReactElement, useCallback, FC, useMemo } from 'react';
import { format } from 'date-fns'
import { Like } from 'typeorm';
import {
  useField,
  FieldInputProps,
  FieldMetaProps,
  FieldHelperProps,
} from 'formik';
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
import { FilterArray } from './PatientFilterScreen';
import { IPatient } from '~/types';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

interface ActiveFilters {
  count: number;
  filters: {
    [key: string]: {
      name: string;
      value: any;
    };
  };
}

type FieldProp = [
  FieldInputProps<any>,
  FieldMetaProps<any>,
  FieldHelperProps<any>,
];

const getActiveFilters = (
  filters: ActiveFilters,
  filter: FieldProp,
): ActiveFilters => {
  const field = filter[0];
  const activeFilters = { ...filters };

  if (field.name === 'gender' && field.value === 'all') {
    activeFilters.count += 1;
    return activeFilters;
  }

  if (field.value) {
    activeFilters.count += 1;

    if (field.name === 'dateOfBirth') {
      const date = format(field.value, 'yyyy-MM-dd');
      activeFilters.filters[field.name] = Like(`%${date}%`);
    } else {
      activeFilters.filters[field.name] = field.value;
    }


    return activeFilters;
  }

  return activeFilters;
};

const applyActiveFilters = (
  models,
  { filters }: ActiveFilters,
  { value }: FieldInputProps<any>,
): IPatient[] => models.Patient.find({
  order: { markedForSync: 'DESC' },
  where: [
    { firstName: Like(`%${value}%`), ...filters },
    { middleName: Like(`%${value}%`), ...filters },
    { lastName: Like(`%${value}%`), ...filters },
    { culturalName: Like(`%${value}%`), ...filters },
  ],
  take: 100,
  cache: true,
});

const Screen: FC<ViewAllScreenProps> = ({
  navigation,
  setSelectedPatient,
}: ViewAllScreenProps): ReactElement => {
  /** Get Search Input */
  const [searchField] = useField('search');
  // Get filters
  const filters = FilterArray.map(fieldName => useField(fieldName));
  const activeFilters = useMemo(
    () => filters.reduce<ActiveFilters>(getActiveFilters, {
      count: 0,
      filters: {},
    }),
    [filters],
  );

  const [list, error] = useBackendEffect(
    ({ models }) => applyActiveFilters(models, activeFilters, searchField),
    [searchField.value],
  );

  const onNavigateToPatientHome = useCallback(patient => {
    setSelectedPatient(patient);
    navigation.navigate(Routes.HomeStack.HomeTabs.Index, {
      screen: Routes.HomeStack.HomeTabs.Home,
    });
  }, []);

  const onNavigateToFilters = useCallback(
    () => navigation.navigate(Routes.HomeStack.SearchPatientStack.FilterSearch),
    [],
  );

  if (!list) {
    return <LoadingScreen text="Loading patients..." />;
  }

  return (
    <FullView>
      <PatientSectionList
        patients={list}
        onPressItem={onNavigateToPatientHome}
      />
      <StyledView
        position="absolute"
        zIndex={2}
        width="100%"
        alignItems="center"
        bottom={30}
      >
        <Button
          width={screenPercentageToDP(60.82, Orientation.Width)}
          backgroundColor={`${theme.colors.MAIN_SUPER_DARK}`}
          bordered
          textColor={theme.colors.WHITE}
          onPress={onNavigateToFilters}
          buttonText={`Filters ${activeFilters.count > 0 ? `${activeFilters.count}` : ''
          }`}
        >
          <StyledView
            marginRight={screenPercentageToDP(2.43, Orientation.Width)}
          >
            <FilterIcon
              fill={
                activeFilters.count > 0
                  ? theme.colors.SECONDARY_MAIN
                  : theme.colors.WHITE
              }
              height={20}
            />
          </StyledView>
        </Button>
      </StyledView>
    </FullView>
  );
};

export const ViewAllScreen = compose(withPatient)(Screen);
