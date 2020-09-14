import React, { ReactElement, useCallback, FC, useMemo } from 'react';
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
import { useBackendEffect } from '~/ui/helpers/hooks';
//Props
import { ViewAllScreenProps } from '/interfaces/screens/PatientSearchStack';
import { Button } from '/components/Button';
import { theme } from '/styled/theme';
import { FilterIcon } from '/components/Icons/FilterIcon';
import { FilterArray } from './PatientFilterScreen';
import { getAgeFromDate } from '/helpers/date';
import { IPatient } from '~/types';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

interface ActiveFiltersI {
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
  acc: ActiveFiltersI,
  item: FieldProp,
): ActiveFiltersI => {
  const curField = item[0];
  switch (curField.name) {
    case 'age':
      if (curField.value[0] !== 0 || curField.value[1] !== 99) {
        acc.count += 1;
        acc.filters[curField.name] = {
          name: curField.name,
          value: curField.value,
        };
        return acc;
      }
      break;
    default:
      if (typeof curField.value === 'string') {
        if (curField.value !== '') {
          acc.count += 1;
          acc.filters[curField.name] = {
            name: curField.name,
            value: curField.value,
          };
          return acc;
        }
      } else if (curField.value !== null && curField.value !== false) {
        acc.count += 1;
        acc.filters[curField.name] = {
          name: curField.name,
          value: curField.value,
        };
        return acc;
      }
      return acc;
  }
  return acc;
};

const isEqual = (prop1: any, prop2: any, fieldName: string): boolean => {
  switch (fieldName) {
    case 'age':
      return prop1 >= prop2[0] && prop1 <= prop2[1];
    case 'gender':
      if (prop2 === 'all') return true;
      return prop1 === prop2;
    case 'dateOfBirth':
      return getAgeFromDate(prop1) === getAgeFromDate(prop2);
    default:
      if (typeof prop1 === 'string') {
        return prop1.includes(prop2);
      }
  }
  return false;
};

const applyActiveFilters = (
  models,
  activeFilters: ActiveFiltersI,
  searchField: FieldInputProps<any>,
): IPatient[] => models.Patient.find({
  order: {
    lastName: 'ASC',
    firstName: 'ASC',
  },
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
    () => filters.reduce<ActiveFiltersI>(getActiveFilters, {
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
    navigation.navigate(Routes.HomeStack.HomeTabs.name, {
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
