import React from 'react';
import { PropTypes } from 'prop-types';

import { VACCINE_CATEGORIES } from '@tamanu/constants';

import { TwoTwoGrid } from '../components/TwoTwoGrid';
import {
  CategoryField,
  VaccineLabelField,
  AdministeredVaccineScheduleField,
  VaccineDateField,
  LocationField,
  DepartmentField,
  GivenByField,
  RecordedByField,
  StyledDivider,
  ConfirmCancelRowField,
  VaccineNameField,
  DiseaseField,
} from '../components/VaccineCommonFields';
import { Field, SuggesterSelectField } from '../components/Field';
import { TranslatedText } from '../components/Translation/TranslatedText';

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
}) => (
  <TwoTwoGrid>
    {!editMode && (
      <CategoryField
        category={category}
        setCategory={setCategory}
        setVaccineLabel={setVaccineLabel}
        resetForm={resetForm}
      />
    )}
    {category === VACCINE_CATEGORIES.OTHER ? (
      <>
        {!editMode && <VaccineNameField />}

        <DiseaseField />
      </>
    ) : (
      !editMode && (
        <>
          <VaccineLabelField
            vaccineLabel={vaccineLabel}
            vaccineOptions={vaccineOptions}
            setVaccineLabel={setVaccineLabel}
          />
          <br />
        </>
      )
    )}

    {!editMode && schedules?.length ? (
      <AdministeredVaccineScheduleField schedules={schedules} />
    ) : null}

    <Field
      name="notGivenReasonId"
      label={<TranslatedText stringId="vaccine.form.notGivenReason.label" fallback="Reason" />}
      component={SuggesterSelectField}
      endpoint="vaccineNotGivenReason"
    />

    <VaccineDateField
      label={<TranslatedText stringId="vaccine.form.dateRecorded.label" fallback="Date recorded" />}
    />

    <StyledDivider />

    <LocationField />
    <DepartmentField />

    <StyledDivider />

    <GivenByField
      label={
        <TranslatedText
          stringId="vaccine.form.supervisingClinician.label"
          fallback="Supervising clinician"
        />
      }
    />

    {!editMode && <RecordedByField />}

    <StyledDivider />

    <ConfirmCancelRowField onConfirm={submitForm} editMode={editMode} onCancel={onCancel} />
  </TwoTwoGrid>
);

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
