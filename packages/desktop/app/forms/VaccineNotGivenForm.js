import React from 'react';
import { PropTypes } from 'prop-types';
import * as yup from 'yup';

import { VACCINE_CATEGORIES } from 'shared/constants';

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

export const VaccineNotGivenForm = ({
  vaccineLabel,
  vaccineOptions,
  administeredOptions,
  submitForm,
  category,
  scheduleOptions,
  onCancel,
  setCategory,
  setVaccineLabel,
}) => (
  <TwoTwoGrid>
    <CategoryField
      category={category}
      setCategory={setCategory}
      setVaccineLabel={setVaccineLabel}
    />
    {category === VACCINE_CATEGORIES.OTHER ? (
      <>
        <VaccineNameField />

        <DiseaseField />
      </>
    ) : (
      <VaccineLabelField
        vaccineLabel={vaccineLabel}
        vaccineOptions={vaccineOptions}
        setVaccineLabel={setVaccineLabel}
      />
    )}

    {administeredOptions.length || scheduleOptions.length ? (
      <AdministeredVaccineScheduleField
        administeredOptions={administeredOptions}
        scheduleOptions={scheduleOptions}
      />
    ) : null}
    <Field
      name="notGivenReasonId"
      label="Reason"
      component={SuggesterSelectField}
      endpoint="vaccineNotGivenReason"
    />
    <VaccineDateField label="Date recorded" />

    <StyledDivider />

    <LocationField />
    <DepartmentField />

    <StyledDivider />

    <GivenByField label="Supervising clinician" />
    <RecordedByField />

    <ConfirmCancelRowField
      onConfirm={submitForm}
      category={category}
      scheduleOptions={scheduleOptions}
      onCancel={onCancel}
    />
  </TwoTwoGrid>
);

VaccineNotGivenForm.propTypes = {
  vaccineLabel: PropTypes.string.isRequired,
  vaccineOptions: PropTypes.array.isRequired,
  administeredOptions: PropTypes.array.isRequired,
  submitForm: PropTypes.func.isRequired,
  category: PropTypes.string.isRequired,
  scheduleOptions: PropTypes.array.isRequired,
  onCancel: PropTypes.func.isRequired,
  setCategory: PropTypes.func.isRequired,
  setVaccineLabel: PropTypes.func.isRequired,
};
