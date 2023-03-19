import React from 'react';
import { PropTypes } from 'prop-types';
import * as yup from 'yup';

import { VACCINE_CATEGORIES, SETTING_KEYS } from 'shared/constants';

import { TwoTwoGrid } from '../components/TwoTwoGrid';
import {
  CategoryField,
  VaccineLabelField,
  BatchField,
  AdministeredVaccineScheduleField,
  VaccineDateField,
  InjectionSiteField,
  LocationField,
  DepartmentField,
  GivenByField,
  RecordedByField,
  ConsentField,
  StyledDivider,
  FullWidthCol,
  ConfirmCancelRowField,
  VaccineNameField,
  VaccineBrandField,
  DiseaseField,
} from '../components/VaccineCommonFields';
import { Field, AutocompleteField, CheckField } from '../components/Field';
import { useSuggester } from '../api';
import { usePatientCurrentEncounter } from '../api/queries';
import { useVaccinationSettings } from '../api/queries/useVaccinationSettings';

export const VACCINE_GIVEN_VALIDATION_SCHEMA = yup.object().shape({
  scheduledVaccineId: yup.string().required(),
  date: yup.string().required(),
  consent: yup
    .boolean()
    .oneOf([true])
    .required(),
});

export const VaccineGivenForm = ({
  patientId,
  vaccineLabel,
  vaccineOptions,
  administeredOptions,
  submitForm,
  category,
  scheduleOptions,
  onCancel,
  setCategory,
  setVaccineLabel,
  values,
}) => {
  const countrySuggester = useSuggester('country');
  const { data: currentEncounter } = usePatientCurrentEncounter(patientId);
  const { data: vaccinationDefaults = {} } = useVaccinationSettings(
    SETTING_KEYS.VACCINATION_DEFAULTS,
  );

  return (
    <TwoTwoGrid>
      <CategoryField
        category={category}
        setCategory={setCategory}
        setVaccineLabel={setVaccineLabel}
      />
      <FullWidthCol>
        <Field name="values.givenOverseas" label="Given overseas" component={CheckField} />
      </FullWidthCol>
      {category === VACCINE_CATEGORIES.OTHER ? (
        <>
          <VaccineNameField />
          <VaccineBrandField />
          <DiseaseField />
        </>
      ) : (
        <VaccineLabelField
          vaccineLabel={vaccineLabel}
          vaccineOptions={vaccineOptions}
          setVaccineLabel={setVaccineLabel}
        />
      )}

      <BatchField />
      {administeredOptions.length || scheduleOptions.length ? (
        <AdministeredVaccineScheduleField
          administeredOptions={administeredOptions}
          scheduleOptions={scheduleOptions}
        />
      ) : null}

      <VaccineDateField label="Date given" />
      <InjectionSiteField />

      <StyledDivider />

      <LocationField
        defaultGroupValue={!currentEncounter ? vaccinationDefaults.data?.locationGroupId : null}
        defaultValue={!currentEncounter ? vaccinationDefaults.data?.locationId : null}
      />
      <DepartmentField
        value={!currentEncounter ? vaccinationDefaults.data?.departmentId : values.departmentId}
      />

      <StyledDivider />

      <GivenByField
        name="givenBy"
        label={values.givenOverseas ? 'Country' : 'Given by'}
        component={values.givenOverseas ? AutocompleteField : undefined}
        suggester={values.givenOverseas ? countrySuggester : undefined}
        required={values.givenOverseas}
      />

      <RecordedByField />

      <StyledDivider />

      <ConsentField
        label={
          values.givenOverseas
            ? 'Do you have consent to record in Tamanu?'
            : 'Do you have consent from the recipient/parent/guardian to give this vaccine and record in Tamanu?'
        }
      />
      <ConfirmCancelRowField
        onConfirm={submitForm}
        category={category}
        scheduleOptions={scheduleOptions}
        onCancel={onCancel}
      />
    </TwoTwoGrid>
  );
};

VaccineGivenForm.propTypes = {
  vaccineLabel: PropTypes.string.isRequired,
  vaccineOptions: PropTypes.array.isRequired,
  administeredOptions: PropTypes.array.isRequired,
  submitForm: PropTypes.func.isRequired,
  category: PropTypes.string.isRequired,
  scheduleOptions: PropTypes.array.isRequired,
  onCancel: PropTypes.func.isRequired,
  setCategory: PropTypes.func.isRequired,
  setVaccineLabel: PropTypes.func.isRequired,
  values: PropTypes.object.isRequired,
};
