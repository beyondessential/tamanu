import React, { useMemo, useEffect, useState } from 'react';
import { PropTypes } from 'prop-types';
import * as yup from 'yup';

import { VACCINE_RECORDING_TYPES, VACCINE_CATEGORIES, SETTING_KEYS } from 'shared/constants';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';

import { Form } from '../components/Field';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingIndicator } from '../components/LoadingIndicator';
import {
  VaccineGivenForm,
  VACCINE_GIVEN_INITIAL_VALUES,
  VACCINE_GIVEN_VALIDATION_SCHEMA,
} from './VaccineGivenForm';
import { VaccineNotGivenForm } from './VaccineNotGivenForm';
import { findVaccinesByAdministeredStatus } from '../utils/findVaccinesByAdministeredStatus';
import { usePatientCurrentEncounter } from '../api/queries';
import { useVaccinationSettings } from '../api/queries/useVaccinationSettings';
import { useAuth } from '../contexts/Auth';

const NEW_ADMINISTERED_VACCINE_VALIDATION_FIELDS = {
  vaccineName: yup.string().when('category', {
    is: VACCINE_CATEGORIES.OTHER,
    then: yup.string().required(),
  }),
  scheduledVaccineId: yup.string().when('category', {
    is: categoryValue => categoryValue !== VACCINE_CATEGORIES.OTHER,
    then: yup.string().required(),
  }),
};

export const BASE_VACCINE_SCHEME_VALIDATION = yup.object().shape({
  date: yup.string().when('givenElsewhere', {
    is: false,
    then: yup.string().required('Date is required'),
  }),
  locationId: yup.string().when('givenElsewhere', {
    is: false,
    then: yup.string().required('Location is required'),
  }),
  departmentId: yup.string().when('givenElsewhere', {
    is: false,
    then: yup.string().required('Department is required'),
  }),
});

export const VaccineForm = ({
  onCancel,
  onSubmit,
  editMode,
  currentVaccineRecordValues,
  patientId,
  getScheduledVaccines,
  vaccineRecordingType,
}) => {
  const [vaccineOptions, setVaccineOptions] = useState([]);
  const [category, setCategory] = useState(null);
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
  const administeredOptions = useMemo(
    () => findVaccinesByAdministeredStatus(selectedVaccine, true),
    [selectedVaccine],
  );
  const scheduleOptions = useMemo(() => findVaccinesByAdministeredStatus(selectedVaccine, false), [
    selectedVaccine,
  ]);

  const { currentUser } = useAuth();

  useEffect(() => {
    if(!editMode){
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

  return (
    <Form
      onSubmit={data => onSubmit({ ...data, category })}
      initialValues={!editMode ? {
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
      } : {
        ...currentVaccineRecordValues,
      }}
      validationSchema={BASE_VACCINE_SCHEME_VALIDATION.shape({
        ...(!editMode && NEW_ADMINISTERED_VACCINE_VALIDATION_FIELDS),
        ...((vaccineRecordingType === VACCINE_RECORDING_TYPES.GIVEN) && VACCINE_GIVEN_VALIDATION_SCHEMA),
      })}
      render={({ submitForm, resetForm, values, setValues }) => (
        <VaccineFormComponent
          vaccineRecordingType={vaccineRecordingType}
          submitForm={submitForm}
          resetForm={resetForm}
          editMode={editMode}
          values={values}
          setValues={setValues}
          vaccineLabel={vaccineLabel}
          vaccineOptions={vaccineOptions}
          category={category}
          setCategory={setCategory}
          setVaccineLabel={setVaccineLabel}
          administeredOptions={administeredOptions}
          scheduleOptions={scheduleOptions}
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
  values,
  setValues,
  patientId,
  ...props
}) => {
  useEffect(() => {
    // Reset the entire form values when switching between GIVEN and NOT_GIVEN tab
    resetForm();

    // we strictly only want to reset the form values when vaccineRecordingType is changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaccineRecordingType]);

  return vaccineRecordingType === VACCINE_RECORDING_TYPES.GIVEN ? (
    <VaccineGivenForm
      {...props}
      submitForm={submitForm}
      values={values}
      patientId={patientId}
      setValues={setValues}
    />
  ) : (
    <VaccineNotGivenForm {...props} submitForm={submitForm} />
  );
};

VaccineForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  patientId: PropTypes.string.isRequired,
  getScheduledVaccines: PropTypes.func.isRequired,
  vaccineRecordingType: PropTypes.string.isRequired,
};
