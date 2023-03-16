import React from 'react';
import { PropTypes } from 'prop-types';
import * as yup from 'yup';

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
} from '../components/VaccineCommonFields';

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
}) => {
  return (
    <TwoTwoGrid>
      <CategoryField
        category={category}
        setCategory={setCategory}
        setVaccineLabel={setVaccineLabel}
      />
      <VaccineLabelField
        vaccineLabel={vaccineLabel}
        vaccineOptions={vaccineOptions}
        setVaccineLabel={setVaccineLabel}
      />
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

      <GivenByField />
      <RecordedByField />

      <StyledDivider />

      <ConsentField />
      <ConfirmCancelRow
        onConfirm={submitForm}
        confirmDisabled={scheduleOptions.length === 0}
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
};
