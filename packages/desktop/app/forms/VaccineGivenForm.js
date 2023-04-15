import React from 'react';
import { PropTypes } from 'prop-types';
import * as yup from 'yup';

import { VACCINE_CATEGORIES } from 'shared/constants';

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
  GivenByCountryField,
  RecordedByField,
  ConsentField,
  StyledDivider,
  FullWidthCol,
  ConfirmCancelRowField,
  VaccineNameField,
  VaccineBrandField,
  DiseaseField,
} from '../components/VaccineCommonFields';
import { Field, CheckField, SuggesterSelectField } from '../components/Field';

export const VACCINE_GIVEN_INITIAL_VALUES = {
  givenElsewhere: false,
  consent: false,
};

export const VACCINE_GIVEN_VALIDATION_SCHEMA = {
  consent: yup
    .bool()
    .oneOf([true])
    .required('Consent is required'),
  vaccineBrand: yup.string().when('category', {
    is: VACCINE_CATEGORIES.OTHER,
    then: yup.string().required(),
  }),
  givenBy: yup.string().when('givenElsewhere', {
    is: true,
    then: yup.string().required(),
  }),
  // will be converted into array of string pre submitting
  circumstanceIds: yup.string().when('givenElsewhere', {
    is: true,
    then: yup.string().required(),
  }),
};

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
  values,
  setValues,
}) => {
  return (
    <TwoTwoGrid>
      <CategoryField
        category={category}
        setCategory={setCategory}
        setVaccineLabel={setVaccineLabel}
      />
      <FullWidthCol>
        <Field
          name="givenElsewhere"
          label="Given elsewhere"
          component={CheckField}
          onChange={() => {
            setValues({ ...values, givenBy: '' });
          }}
        />
      </FullWidthCol>
      {values.givenElsewhere && (
        <FullWidthCol>
          <Field
            name="circumstanceIds"
            label="Circumstances"
            component={SuggesterSelectField}
            endpoint="icd10"
            isMulti
            required
          />
        </FullWidthCol>
      )}
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

      <VaccineDateField label="Date given" required={!values.givenElsewhere} />
      <InjectionSiteField />

      <StyledDivider />

      <LocationField />
      <DepartmentField />

      <StyledDivider />

      {values.givenElsewhere ? <GivenByCountryField /> : <GivenByField />}

      <RecordedByField />

      <StyledDivider />

      <ConsentField
        label={
          values.givenElsewhere
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
