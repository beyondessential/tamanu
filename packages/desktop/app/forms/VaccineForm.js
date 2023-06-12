import React, { useMemo, useEffect, useState } from 'react';
import { PropTypes } from 'prop-types';
import * as yup from 'yup';

import { VACCINE_RECORDING_TYPES, VACCINE_CATEGORIES, SETTING_KEYS } from 'shared/constants';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';

import { REQUIRED_INLINE_ERROR_MESSAGE } from '../constants';
import { Form } from '../components/Field';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingIndicator } from '../components/LoadingIndicator';
import {
  VaccineGivenForm,
  VACCINE_GIVEN_INITIAL_VALUES,
  VACCINE_GIVEN_VALIDATION_SCHEMA,
} from './VaccineGivenForm';
import { VaccineNotGivenForm } from './VaccineNotGivenForm';
import { usePatientCurrentEncounter } from '../api/queries';
import { useVaccinationSettings } from '../api/queries/useVaccinationSettings';
import { useAuth } from '../contexts/Auth';

const validateGivenElsewhereRequiredField = (status, givenElsewhere) =>
  (status === VACCINE_RECORDING_TYPES.GIVEN && !givenElsewhere) ||
  status === VACCINE_RECORDING_TYPES.NOT_GIVEN; // If NOT_GIVEN then do not care about givenElsewhere

const BASE_VACCINE_SCHEME_VALIDATION = yup.object().shape({
  date: yup.string().when(['status', 'givenElsewhere'], {
    is: validateGivenElsewhereRequiredField,
    then: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
    otherwise: yup.string().nullable(),
  }),
  locationId: yup.string().when(['status', 'givenElsewhere'], {
    is: validateGivenElsewhereRequiredField,
    then: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
    otherwise: yup.string().nullable(),
  }),
  departmentId: yup.string().when(['status', 'givenElsewhere'], {
    is: validateGivenElsewhereRequiredField,
    then: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
    otherwise: yup.string().nullable(),
  }),
});

export const NEW_RECORD_VACCINE_SCHEME_VALIDATION = BASE_VACCINE_SCHEME_VALIDATION.shape({
  category: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
  vaccineLabel: yup.string().when('category', {
    is: categoryValue => !!categoryValue && categoryValue !== VACCINE_CATEGORIES.OTHER,
    then: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
    otherwise: yup.string().nullable(),
  }),
  vaccineName: yup.string().when('category', {
    is: VACCINE_CATEGORIES.OTHER,
    then: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
    otherwise: yup.string().nullable(),
  }),
  scheduledVaccineId: yup.string().when('category', {
    is: categoryValue => categoryValue !== VACCINE_CATEGORIES.OTHER,
    then: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
    otherwise: yup.string().nullable(),
  }),
});

export const VaccineForm = ({
  onCancel,
  onSubmit,
  editMode = false,
  currentVaccineRecordValues,
  patientId,
  getScheduledVaccines,
  vaccineRecordingType,
}) => {
  const [vaccineOptions, setVaccineOptions] = useState([]);
  const [category, setCategory] = useState(
    currentVaccineRecordValues?.vaccineName ? VACCINE_CATEGORIES.OTHER : VACCINE_CATEGORIES.ROUTINE,
  );
  const [vaccineLabel, setVaccineLabel] = useState();

  const {
    data: currentEncounter,
    isLoading: isLoadingCurrentEncounter,
    error: currentEncounterError,
  } = usePatientCurrentEncounter(patientId);
  const {
    data: vaccinationDefaults = {},
    isLoading: isLoadingVaccinationDefaults,
    error: vaccinationDefaultsError,
  } = useVaccinationSettings(SETTING_KEYS.VACCINATION_DEFAULTS);

  const selectedVaccine = useMemo(() => vaccineOptions.find(v => v.label === vaccineLabel), [
    vaccineLabel,
    vaccineOptions,
  ]);

  const { currentUser } = useAuth();

  useEffect(() => {
    if (!editMode) {
      const fetchScheduledVaccines = async () => {
        if (!category || category === VACCINE_CATEGORIES.OTHER) {
          setVaccineOptions([]);
          return;
        }
        const availableScheduledVaccines = await getScheduledVaccines({ category });
        setVaccineOptions(
          availableScheduledVaccines.map(vaccine => ({
            label: vaccine.label,
            value: vaccine.label,
            schedules: vaccine.schedules,
          })),
        );
      };

      fetchScheduledVaccines();
    }
  }, [category, getScheduledVaccines, editMode]);

  if (isLoadingCurrentEncounter || isLoadingVaccinationDefaults) {
    return <LoadingIndicator />;
  }

  if (currentEncounterError || vaccinationDefaultsError) {
    return (
      <ErrorMessage
        title="Cannot load vaccine form"
        errorMessage={currentEncounterError?.message || vaccinationDefaultsError?.message}
      />
    );
  }

  const baseSchemeValidation = editMode
    ? BASE_VACCINE_SCHEME_VALIDATION
    : NEW_RECORD_VACCINE_SCHEME_VALIDATION;

  return (
    <Form
      onSubmit={data => onSubmit({ ...data, category })}
      showInlineErrorsOnly
      initialValues={
        !editMode
          ? {
              status: vaccineRecordingType,
              category,
              date: getCurrentDateTimeString(),
              locationGroupId: !currentEncounter
                ? vaccinationDefaults.data?.locationGroupId
                : currentEncounter.location?.locationGroup?.id,
              locationId: !currentEncounter
                ? vaccinationDefaults.data?.locationId
                : currentEncounter.location?.id,
              departmentId: !currentEncounter
                ? vaccinationDefaults.data?.departmentId
                : currentEncounter.department?.id,
              ...(vaccineRecordingType === VACCINE_RECORDING_TYPES.GIVEN
                ? VACCINE_GIVEN_INITIAL_VALUES
                : {}),
            }
          : {
              ...currentVaccineRecordValues,
            }
      }
      validationSchema={baseSchemeValidation.shape({
        ...(vaccineRecordingType === VACCINE_RECORDING_TYPES.GIVEN &&
          VACCINE_GIVEN_VALIDATION_SCHEMA),
      })}
      render={({ submitForm, resetForm, setErrors, values, setValues }) => (
        <VaccineFormComponent
          vaccineRecordingType={vaccineRecordingType}
          submitForm={submitForm}
          resetForm={resetForm}
          setErrors={setErrors}
          editMode={editMode}
          values={values}
          setValues={setValues}
          vaccineLabel={vaccineLabel}
          vaccineOptions={vaccineOptions}
          category={category}
          setCategory={setCategory}
          setVaccineLabel={setVaccineLabel}
          schedules={selectedVaccine?.schedules}
          onCancel={onCancel}
          currentUser={currentUser}
        />
      )}
    />
  );
};

const VaccineFormComponent = ({
  vaccineRecordingType,
  submitForm,
  resetForm,
  setErrors,
  values,
  setValues,
  patientId,
  ...props
}) => {
  const { setCategory, setVaccineLabel, editMode } = props;
  useEffect(() => {
    // Reset the entire form values when switching between GIVEN and NOT_GIVEN tab
    resetForm();
    if (!editMode) {
      setCategory(VACCINE_CATEGORIES.ROUTINE);
    }
    setVaccineLabel(null);
    // we strictly only want to reset the form values when vaccineRecordingType is changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaccineRecordingType]);

  return vaccineRecordingType === VACCINE_RECORDING_TYPES.GIVEN ? (
    <VaccineGivenForm
      {...props}
      resetForm={resetForm}
      setErrors={setErrors}
      submitForm={submitForm}
      values={values}
      patientId={patientId}
      setValues={setValues}
    />
  ) : (
    <VaccineNotGivenForm {...props} resetForm={resetForm} submitForm={submitForm} />
  );
};

VaccineForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  patientId: PropTypes.string.isRequired,
  getScheduledVaccines: PropTypes.func.isRequired,
  vaccineRecordingType: PropTypes.string.isRequired,
};
