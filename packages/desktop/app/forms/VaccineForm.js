import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { PropTypes } from 'prop-types';

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
import { VaccineNotGivenForm, VACCINE_NOT_GIVEN_VALIDATION_SCHEMA } from './VaccineNotGivenForm';
import { getCurrentUser } from '../store/auth';
import { findVaccinesByAdministeredStatus } from '../utils/findVaccinesByAdministeredStatus';
import { usePatientCurrentEncounter } from '../api/queries';
import { useVaccinationSettings } from '../api/queries/useVaccinationSettings';

export const VaccineForm = ({
  onCancel,
  onSubmit,
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

  const currentUser = useSelector(getCurrentUser);

  useEffect(() => {
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
  }, [category, getScheduledVaccines]);

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

  const baseProps = {
    vaccineLabel,
    vaccineOptions,
    category,
    setCategory,
    setVaccineLabel,
    administeredOptions,
    scheduleOptions,
    onSubmit: data => {
      onSubmit({ ...data, category });
    },
    onCancel,
    currentUser,
  };

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={{
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
      }}
      validationSchema={
        vaccineRecordingType === VACCINE_RECORDING_TYPES.GIVEN
          ? VACCINE_GIVEN_VALIDATION_SCHEMA
          : VACCINE_NOT_GIVEN_VALIDATION_SCHEMA
      }
      render={({ submitForm, values = {} }) => {
        return vaccineRecordingType === VACCINE_RECORDING_TYPES.GIVEN ? (
          <VaccineGivenForm
            {...baseProps}
            submitForm={submitForm}
            values={values}
            patientId={patientId}
          />
        ) : (
          <VaccineNotGivenForm {...baseProps} submitForm={submitForm} />
        );
      }}
    />
  );
};

VaccineForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  patientId: PropTypes.string.isRequired,
  getScheduledVaccines: PropTypes.func.isRequired,
  vaccineRecordingType: PropTypes.string.isRequired,
};
