import React from 'react';
import { PropTypes } from 'prop-types';
import * as yup from 'yup';

import { VACCINE_CATEGORIES } from '@tamanu/constants';
import { useDateTimeFormat } from '@tamanu/ui-components';

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
import { CheckField, Field, LocalisedField, SuggesterSelectField } from '../components/Field';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const VACCINE_GIVEN_INITIAL_VALUES = {
  givenElsewhere: false,
  consent: false,
};

export const VACCINE_GIVEN_VALIDATION_SCHEMA = (vaccineConsentEnabled) => ({
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
  const { getCurrentDate } = useDateTimeFormat();
  
  return (
    <TwoTwoGrid data-testid="twotwogrid-2swz">
      {!editMode && (
        <>
          <CategoryField
            category={category}
            setCategory={setCategory}
            setVaccineLabel={setVaccineLabel}
            resetForm={resetForm}
            data-testid="categoryfield-ea5g"
          />
          <FullWidthCol data-testid="fullwidthcol-aod1">
            <Field
              name="givenElsewhere"
              label={
                <TranslatedText
                  stringId="vaccine.givenElsewhereCheckbox.label"
                  fallback="Given elsewhere (e.g overseas)"
                  data-testid="translatedtext-dosn"
                />
              }
              component={CheckField}
              onChange={(_e, value) => {
                setErrors({});
                const newValues = { ...values };
                delete newValues.givenBy;
                if (!value) {
                  delete newValues.circumstanceIds;
                  newValues.date = getCurrentDate();
                } else {
                  delete newValues.date;
                }
                setValues(newValues);
              }}
              data-testid="field-w50x"
            />
          </FullWidthCol>
        </>
      )}
      {values.givenElsewhere && (
        <>
          <FullWidthCol data-testid="fullwidthcol-lan5">
            <LocalisedField
              name="circumstanceIds"
              label={
                <TranslatedText
                  stringId="general.localisedField.circumstanceIds.label"
                  fallback="Circumstances"
                  data-testid="translatedtext-sasa"
                />
              }
              component={SuggesterSelectField}
              endpoint="vaccineCircumstance"
              isMulti
              required
              data-testid="localisedfield-hbif"
            />
          </FullWidthCol>
          <StyledDivider data-testid="styleddivider-yvrw" />
        </>
      )}
      {category === VACCINE_CATEGORIES.OTHER ? (
        <>
          {!editMode && <VaccineNameField data-testid="vaccinenamefield-j11j" />}
          <BatchField data-testid="batchfield-ar2v" />
          <VaccineBrandField data-testid="vaccinebrandfield-78qs" />
          <DiseaseField data-testid="diseasefield-fuya" />
        </>
      ) : (
        <>
          {!editMode && (
            <VaccineLabelField
              vaccineLabel={vaccineLabel}
              vaccineOptions={vaccineOptions}
              setVaccineLabel={setVaccineLabel}
              data-testid="vaccinelabelfield-myrt"
            />
          )}
          <BatchField data-testid="batchfield-25ma" />
        </>
      )}
      {!editMode && schedules?.length ? (
        <AdministeredVaccineScheduleField
          schedules={schedules}
          data-testid="administeredvaccineschedulefield-cjfr"
        />
      ) : null}
      <VaccineDateField
        label={
          <TranslatedText
            stringId="vaccine.dateGiven.label"
            fallback="Date given"
            data-testid="translatedtext-hitn"
          />
        }
        required={!values.givenElsewhere}
        min={values?.patientData?.dateOfBirth}
        max={getCurrentDate()}
        keepIncorrectValue
        data-testid="vaccinedatefield-z99f"
      />
      <InjectionSiteField data-testid="injectionsitefield-hu3i" />
      {!values.givenElsewhere ? (
        <>
          <StyledDivider data-testid="styleddivider-ovzg" />

          <LocationField data-testid="locationfield-nwr3" />
          <DepartmentField data-testid="departmentfield-n0z2" />
        </>
      ) : null}
      <StyledDivider data-testid="styleddivider-zbi2" />
      {values.givenElsewhere ? (
        <GivenByCountryField data-testid="givenbycountryfield-oyam" />
      ) : (
        <GivenByField data-testid="givenbyfield-ekoq" />
      )}
      {values.givenElsewhere && !editMode && <StyledDivider data-testid="styleddivider-rvqm" />}
      {!editMode && <RecordedByField data-testid="recordedbyfield-40th" />}
      {vaccineConsentEnabled && (
        <>
          <StyledDivider data-testid="styleddivider-dvgo" />
          <ConsentField
            label={
              values.givenElsewhere
                ? 'Do you have consent to record this vaccine?'
                : 'Do you have consent from the recipient/parent/guardian to give and record this vaccine?'
            }
            data-testid="consentfield-rvwt"
          />
          <ConsentGivenByField data-testid="consentgivenbyfield-xg85" />
        </>
      )}
      <StyledDivider data-testid="styleddivider-acb9" />
      <ConfirmCancelRowField
        onConfirm={submitForm}
        editMode={editMode}
        onCancel={onCancel}
        data-testid="confirmcancelrowfield-8qv4"
      />
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
