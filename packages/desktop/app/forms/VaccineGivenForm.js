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
  ConsentGivenByField,
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
        onChange={(_e, value) => {
          const newValues = { ...values };
          if (value !== VACCINE_CATEGORIES.OTHER) {
            delete newValues.vaccineName;
            delete newValues.vaccineBrand;
            delete newValues.disease;
          } else {
            delete newValues.scheduledVaccineId;
          }

          setValues(newValues);
        }}
      />
      <FullWidthCol>
        <Field
          name="givenElsewhere"
          label="Given elsewhere"
          component={CheckField}
          onChange={(_e, value) => {
            const newValues = { ...values };
            delete newValues.givenBy;

            if (!value) {
              delete newValues.circumstanceIds;
            }

            setValues(newValues);
          }}
        />
      </FullWidthCol>
      {values.givenElsewhere && (
        <>
          <FullWidthCol>
            <Field
              name="circumstanceIds"
              label="Circumstances"
              component={SuggesterSelectField}
              endpoint="vaccineCircumstances"
              isMulti
              required
            />
          </FullWidthCol>
          <StyledDivider />
        </>
      )}
      {category === VACCINE_CATEGORIES.OTHER ? (
        <>
          <VaccineNameField />
          <BatchField />
          <VaccineBrandField />
          <DiseaseField />
        </>
      ) : (
        <>
          <VaccineLabelField
            vaccineLabel={vaccineLabel}
            vaccineOptions={vaccineOptions}
            setVaccineLabel={setVaccineLabel}
          />
          <BatchField />
        </>
      )}

      {administeredOptions.length || scheduleOptions.length ? (
        <AdministeredVaccineScheduleField
          administeredOptions={administeredOptions}
          scheduleOptions={scheduleOptions}
        />
      ) : null}

      <VaccineDateField label="Date given" required={!values.givenElsewhere} />
      <InjectionSiteField />

      {!values.givenElsewhere ? (
        <>
          <StyledDivider />

          <LocationField />
          <DepartmentField />
        </>
      ) : null}

      <StyledDivider />

      {values.givenElsewhere ? <GivenByCountryField /> : <GivenByField />}

      {values.givenElsewhere && <StyledDivider />}

      <RecordedByField />

      <StyledDivider />

      <ConsentField
        label={
          values.givenElsewhere
            ? 'Do you have consent to record in Tamanu?'
            : 'Do you have consent from the recipient/parent/guardian to give this vaccine and record in Tamanu?'
        }
      />

      <ConsentGivenByField />

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
