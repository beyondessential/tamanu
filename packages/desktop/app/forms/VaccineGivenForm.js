import React from 'react';
import { PropTypes } from 'prop-types';
import * as yup from 'yup';

import { VACCINE_CATEGORIES } from 'shared/constants';

import { TwoTwoGrid } from '../components/TwoTwoGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
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
} from '../components/VaccineCommonFields';
import { Field, AutocompleteField, CheckField, TextField } from '../components/Field';
import { useSuggester } from '../api';

export const VACCINE_GIVEN_VALIDATION_SCHEMA = yup.object().shape({
  scheduledVaccineId: yup.string().required(),
  date: yup.string().required(),
  consent: yup
    .boolean()
    .oneOf([true])
    .required(),
});

export const VaccineGivenForm = ({
  vaccineLabel,
  vaccineOptions,
  administeredOptions,
  submitForm,
  category,
  scheduleOptions,
  onCancel,
  setCategory,
  setVaccineLabel,
  givenOverseas,
}) => {
  const countrySuggester = useSuggester('country');

  return (
    <TwoTwoGrid>
      <CategoryField
        category={category}
        setCategory={setCategory}
        setVaccineLabel={setVaccineLabel}
      />
      <FullWidthCol>
        <Field name="givenOverseas" label="Given overseas" component={CheckField} />
      </FullWidthCol>
      {category === VACCINE_CATEGORIES.OTHER ? (
        <>
          <Field name="vaccineName" label="Vaccine name" component={TextField} required />

          <Field name="vaccineBrand" label="Vaccine brand" component={TextField} required />
          <Field name="disease" label="Disease" component={TextField} required />
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

      <LocationField />
      <DepartmentField />

      <StyledDivider />

      <GivenByField
        name="givenBy"
        label={givenOverseas ? 'Country' : 'Given by'}
        component={givenOverseas ? AutocompleteField : undefined}
        suggester={givenOverseas ? countrySuggester : undefined}
        required={givenOverseas}
      />

      <RecordedByField />

      <StyledDivider />

      <ConsentField
        label={
          givenOverseas
            ? 'Do you have consent to record in Tamanu?'
            : 'Do you have consent from the recipient/parent/guardian to give this vaccine and record in Tamanu?'
        }
      />
      <ConfirmCancelRow
        onConfirm={submitForm}
        confirmDisabled={category !== VACCINE_CATEGORIES.OTHER && scheduleOptions.length === 0}
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
  givenOverseas: PropTypes.bool.isRequired,
};
