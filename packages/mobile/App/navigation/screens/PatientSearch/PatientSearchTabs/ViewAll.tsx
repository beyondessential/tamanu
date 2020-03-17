import React, { ReactElement, useCallback, FC, useMemo } from 'react';
import { useField, FieldInputProps, FieldMetaProps, FieldHelperProps } from 'formik';
import { compose } from 'redux';
// Containers
import { withPatient } from '../../../../containers/Patient';
// Components
import { FullView, StyledView, RotateView } from '../../../../styled/common';
import { PatientSectionList } from '../../../../components/PatientSectionList';
// Helpers
import { searchData, DataProps } from './fixture';
import { groupEntriesByLetter } from '../../../../helpers/list';
import { Routes } from '../../../../helpers/constants';
//Props
import { ViewAllScreenProps } from '../../../../interfaces/screens/PatientSearchStack';
import { Button } from '../../../../components/Button';
import { theme } from '../../../../styled/theme';
import { OptionsGlyph } from '../../../../components/Icons';
import { FilterArray } from './PatientFilterScreen';
import { compareDate } from '../../../../helpers/date';

interface ActiveFiltersI {
      count: number;
      filters: {
        [key: string]: {
          name: string;
          value: any;
        }
      },
}

type FieldProp = [FieldInputProps<any>, FieldMetaProps<any>, FieldHelperProps<any>]

const getActiveFilters = (acc: ActiveFiltersI, item: FieldProp): ActiveFiltersI => {
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
      return compareDate(prop1, prop2);
    default:
      if (typeof prop1 === 'string') {
        return prop1.includes(prop2);
      }
  }
  return false;
};

const applyActiveFilters = (
  activeFilters:ActiveFiltersI,
  data: DataProps[],
  searchField: FieldInputProps<any>,
): DataProps[] => {
  if (activeFilters.count > 0) {
    // apply filters
    return data.filter((patientData) => Object.keys(activeFilters.filters).every(
      fieldToFilter => isEqual(
        patientData[fieldToFilter],
        activeFilters.filters[fieldToFilter].value, fieldToFilter,
      ),
    ));
  } else if (searchField.value !== '') {
    return data.filter(patientData => `${patientData.firstName} ${patientData.lastName}`.includes(searchField.value));
  }
  return data;
};

const Screen: FC<ViewAllScreenProps> = (
  {
    navigation,
    setSelectedPatient,
  }: ViewAllScreenProps,
): ReactElement => {
  /** Get Search Input */
  const [searchField] = useField('search');
  let list = [];
  // Get filters
  const filters = FilterArray.map(fieldName => useField(fieldName));
  const activeFilters = useMemo(() => filters
    .reduce<ActiveFiltersI>(getActiveFilters, {
      count: 0,
      filters: {},
    }), [filters]);

  list = applyActiveFilters(activeFilters, searchData, searchField);

  list = groupEntriesByLetter(list.reduce((acc: any, cur: DataProps) => {
    acc.push({
      id: cur.id,
      name: `${cur.firstName} ${cur.lastName}`,
      city: cur.city,
      lastVisit: cur.lastVisit,
      gender: cur.gender,
      age: cur.age,
    });
    return acc;
  }, []));


  const onNavigateToPatientHome = useCallback(
    (patient) => {
      setSelectedPatient(patient);
      navigation.navigate(Routes.HomeStack.Home);
    },
    [],
  );

  const onNavigateToFilters = useCallback(
    () => navigation.navigate(Routes.HomeStack.SearchPatientStack.FilterSearch),
    [],
  );

  return (
    <FullView>
      <PatientSectionList
        data={list}
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
          width={250}
          backgroundColor={`${theme.colors.MAIN_SUPER_DARK}`}
          bordered
          textColor={theme.colors.WHITE}
          onPress={onNavigateToFilters}
          buttonText={`Filters ${activeFilters.count > 0 ? `${activeFilters.count}` : ''}`}
        >
          <RotateView>
            <OptionsGlyph
              fill={activeFilters.count > 0 ? theme.colors.SECONDARY_MAIN : theme.colors.WHITE}
              height={20}
            />
          </RotateView>
        </Button>
      </StyledView>
    </FullView>
  );
};

export const ViewAllScreen = compose(withPatient)(Screen);
