import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { PropTypes } from 'prop-types';

import { VACCINE_RECORDING_TYPES } from 'shared/constants';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';

import { Form } from '../components/Field';
import {
  VaccineGivenForm,
  VACCINE_GIVEN_INITIAL_VALUES,
  VACCINE_GIVEN_VALIDATION_SCHEMA,
} from './VaccineGivenForm';
import { VaccineNotGivenForm, VACCINE_NOT_GIVEN_VALIDATION_SCHEMA } from './VaccineNotGivenForm';
import { getCurrentUser } from '../store/auth';
import { findVaccinesByAdministeredStatus } from '../utils/findVaccinesByAdministeredStatus';

export const VaccineForm = ({ onCancel, onSubmit, getScheduledVaccines, vaccineRecordingType }) => {
  const [vaccineOptions, setVaccineOptions] = useState([]);
  const [category, setCategory] = useState(null);
  const [vaccineLabel, setVaccineLabel] = useState();

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
      if (!category) {
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

  const baseProps = {
    vaccineLabel,
    vaccineOptions,
    category,
    setCategory,
    setVaccineLabel,
    administeredOptions,
    scheduleOptions,
    onSubmit,
    onCancel,
    currentUser,
  };

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={{
        date: getCurrentDateTimeString(),
        ...(vaccineRecordingType === VACCINE_RECORDING_TYPES.GIVEN
          ? VACCINE_GIVEN_INITIAL_VALUES
          : {}),
      }}
      validationSchema={
        vaccineRecordingType === VACCINE_RECORDING_TYPES.GIVEN
          ? VACCINE_GIVEN_VALIDATION_SCHEMA
          : VACCINE_NOT_GIVEN_VALIDATION_SCHEMA
      }
      render={({ submitForm, values: { givenOverseas } }) => {
        return vaccineRecordingType === VACCINE_RECORDING_TYPES.GIVEN ? (
          <VaccineGivenForm {...baseProps} submitForm={submitForm} givenOverseas={givenOverseas} />
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
  getScheduledVaccines: PropTypes.func.isRequired,
  vaccineRecordingType: PropTypes.string.isRequired,
};
