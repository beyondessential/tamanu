import React from 'react';
import { PropTypes } from 'prop-types';
import * as yup from 'yup';

import { VACCINE_CATEGORIES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { REQUIRED_INLINE_ERROR_MESSAGE } from '../constants';
import { TwoTwoGrid } from '../components/TwoTwoGrid';
import {
  AdministeredVaccineScheduleField,
  BatchField,
  CategoryField,
  ConfirmCancelRowField,
  ConsentField,
  ConsentGivenByField,
  DepartmentField,
  DiseaseField,
  FullWidthCol,
  GivenByCountryField,
  GivenByField,
  InjectionSiteField,
  LocationField,
  RecordedByField,
  StyledDivider,
  VaccineBrandField,
  VaccineDateField,
  VaccineLabelField,
  VaccineNameField,
} from '../components/VaccineCommonFields';
import { CheckField, Field, SuggesterSelectField } from '../components/Field';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const VACCINE_GIVEN_INITIAL_VALUES = {
  givenElsewhere: false,
  consent: false,
};

export const VACCINE_GIVEN_VALIDATION_SCHEMA = vaccineConsentEnabled => ({
  consent: vaccineConsentEnabled
    ? yup.bool().oneOf([true], REQUIRED_INLINE_ERROR_MESSAGE)
    : yup.bool(),
  givenBy: yup.string().when('givenElsewhere', {
    is: true,
    then: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
    otherwise: yup.string().nullable(),
  }),
  // will be converted into array of string pre submitting
  circumstanceIds: yup.string().when('givenElsewhere', {
    is: true,
    then: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
    otherwise: yup.string().nullable(),
  }),
});

export const VaccineGivenForm = ({
  vaccineLabel,
  vaccineOptions,
  editMode = false,
  resetForm,
  submitForm,
  setErrors,
  category,
  schedules,
  onCancel,
  setCategory,
  setVaccineLabel,
  values,
  setValues,
  vaccineConsentEnabled,
}) => {
  return (
    <TwoTwoGrid>
      {!editMode && (
        <>
          <CategoryField
            category={category}
            setCategory={setCategory}
            setVaccineLabel={setVaccineLabel}
            resetForm={resetForm}
          />
          <FullWidthCol>
            <Field
              name="givenElsewhere"
              label={
                <TranslatedText
                  stringId="vaccine.givenElsewhereCheckbox.label"
                  fallback="Given elsewhere (e.g overseas)"
                />
              }
              component={CheckField}
              onChange={(_e, value) => {
                setErrors({});
                const newValues = { ...values };
                delete newValues.givenBy;
                if (!value) {
                  delete newValues.circumstanceIds;
                  newValues.date = getCurrentDateTimeString();
                } else {
                  delete newValues.date;
                }
                setValues(newValues);
              }}
            />
          </FullWidthCol>
        </>
      )}
      {values.givenElsewhere && (
        <>
          <FullWidthCol>
            <Field
              name="circumstanceIds"
              label={
                <TranslatedText stringId="vaccine.circumstances.label" fallback="Circumstances" />
              }
              component={SuggesterSelectField}
              endpoint="vaccineCircumstance"
              isMulti
              required
            />
          </FullWidthCol>
          <StyledDivider />
        </>
      )}
      {category === VACCINE_CATEGORIES.OTHER ? (
        <>
          {!editMode && <VaccineNameField />}
          <BatchField />
          <VaccineBrandField />
          <DiseaseField />
        </>
      ) : (
        <>
          {!editMode && (
            <VaccineLabelField
              vaccineLabel={vaccineLabel}
              vaccineOptions={vaccineOptions}
              setVaccineLabel={setVaccineLabel}
            />
          )}
          <BatchField />
        </>
      )}

      {!editMode && schedules?.length ? (
        <AdministeredVaccineScheduleField schedules={schedules} />
      ) : null}

      <VaccineDateField
        label={<TranslatedText stringId="vaccine.dateGiven.label" fallback="Date given" />}
        required={!values.givenElsewhere}
      />

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

      {values.givenElsewhere && !editMode && <StyledDivider />}

      {!editMode && <RecordedByField />}

      {vaccineConsentEnabled && (
        <>
          <StyledDivider />
          <ConsentField
            label={
              values.givenElsewhere
                ? 'Do you have consent to record in Tamanu?'
                : 'Do you have consent from the recipient/parent/guardian to give this vaccine and record in Tamanu?'
            }
          />
          <ConsentGivenByField />
        </>
      )}
      <StyledDivider />

      <ConsentField
        label={
          values.givenElsewhere ? (
            <TranslatedText
              stringId="vaccine.consentGivenElsewhere.label"
              fallback="Do you have consent to record this vaccine?"
            />
          ) : (
            <TranslatedText
              stringId="vaccine.consent.label"
              fallback="Do you have consent from the recipient/parent/guardian to give and record this vaccine?"
            />
          )
        }
      />

      <ConsentGivenByField />

      <StyledDivider />

      <ConfirmCancelRowField onConfirm={submitForm} editMode={editMode} onCancel={onCancel} />
    </TwoTwoGrid>
  );
};

VaccineGivenForm.propTypes = {
  vaccineLabel: PropTypes.string.isRequired,
  vaccineOptions: PropTypes.array.isRequired,
  submitForm: PropTypes.func.isRequired,
  category: PropTypes.string.isRequired,
  schedules: PropTypes.array.isRequired,
  onCancel: PropTypes.func.isRequired,
  setCategory: PropTypes.func.isRequired,
  setVaccineLabel: PropTypes.func.isRequired,
  values: PropTypes.object.isRequired,
};
