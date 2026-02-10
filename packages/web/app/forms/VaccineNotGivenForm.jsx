import React from 'react';
import { PropTypes } from 'prop-types';

import { VACCINE_CATEGORIES } from '@tamanu/constants';

import { TwoTwoGrid } from '../components/TwoTwoGrid';
import {
  AdministeredVaccineScheduleField,
  ConfirmCancelRowField,
  CategoryField,
  DepartmentField,
  DiseaseField,
  GivenByField,
  LocationField,
  RecordedByField,
  StyledDivider,
  VaccineDateField,
  VaccineLabelField,
  VaccineNameField,
} from '../components/VaccineCommonFields';
import { LocalisedField, SuggesterSelectField } from '../components/Field';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useDateTimeFormat } from '@tamanu/ui-components';

export const VaccineNotGivenForm = ({
  vaccineLabel,
  vaccineOptions,
  editMode = false,
  resetForm,
  submitForm,
  category,
  schedules,
  onCancel,
  setCategory,
  setVaccineLabel,
  values,
}) => {
  const { getCurrentDate } = useDateTimeFormat();

  return (
    <TwoTwoGrid data-testid="twotwogrid-ng3x">
    {!editMode && (
      <CategoryField
        category={category}
        setCategory={setCategory}
        setVaccineLabel={setVaccineLabel}
        resetForm={resetForm}
        data-testid="categoryfield-z56o"
      />
    )}
    {category === VACCINE_CATEGORIES.OTHER ? (
      <>
        {!editMode && <VaccineNameField data-testid="vaccinenamefield-6dpr" />}

        <DiseaseField data-testid="diseasefield-xxrx" />
      </>
    ) : (
      !editMode && (
        <>
          <VaccineLabelField
            vaccineLabel={vaccineLabel}
            vaccineOptions={vaccineOptions}
            setVaccineLabel={setVaccineLabel}
            data-testid="vaccinelabelfield-tv4u"
          />
          <br />
        </>
      )
    )}

    {!editMode && schedules?.length ? (
      <AdministeredVaccineScheduleField
        schedules={schedules}
        data-testid="administeredvaccineschedulefield-6a3r"
      />
    ) : null}

    <LocalisedField
      name="notGivenReasonId"
      label={
        <TranslatedText
          stringId="vaccine.notGivenReason.label"
          fallback="Reason"
          data-testid="translatedtext-u1dv"
        />
      }
      component={SuggesterSelectField}
      endpoint="vaccineNotGivenReason"
      data-testid="localisedfield-olx5"
    />

    <VaccineDateField
      label={
        <TranslatedText
          stringId="vaccine.dateRecorded.label"
          fallback="Date recorded"
          data-testid="translatedtext-0c0a"
        />
      }
      min={values?.patientData?.dateOfBirth}
      max={getCurrentDate()}
      keepIncorrectValue
      data-testid="vaccinedatefield-jzo2"
    />

    <StyledDivider data-testid="styleddivider-j5dz" />

    <LocationField data-testid="locationfield-cycj" />
    <DepartmentField data-testid="departmentfield-seg3" />

    <StyledDivider data-testid="styleddivider-iprr" />

    <GivenByField
      label={
        <TranslatedText
          stringId="general.supervisingClinician.label"
          fallback="Supervising :clinician"
          replacements={{
            clinician: (
              <TranslatedText
                stringId="general.localisedField.clinician.label.short"
                fallback="Clinician"
                casing="lower"
                data-testid="translatedtext-vzip"
              />
            ),
          }}
          data-testid="translatedtext-0pgo"
        />
      }
      data-testid="givenbyfield-m30g"
    />

    {!editMode && <RecordedByField data-testid="recordedbyfield-79v5" />}

    <StyledDivider data-testid="styleddivider-930m" />

    <ConfirmCancelRowField
      onConfirm={submitForm}
      editMode={editMode}
      onCancel={onCancel}
      data-testid="confirmcancelrowfield-8qv4"
    />
  </TwoTwoGrid>
  );
};

VaccineNotGivenForm.propTypes = {
  vaccineLabel: PropTypes.string.isRequired,
  vaccineOptions: PropTypes.array.isRequired,
  submitForm: PropTypes.func.isRequired,
  category: PropTypes.string.isRequired,
  schedules: PropTypes.array.isRequired,
  onCancel: PropTypes.func.isRequired,
  setCategory: PropTypes.func.isRequired,
  setVaccineLabel: PropTypes.func.isRequired,
};
