import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { PropTypes } from 'prop-types';

import { VACCINE_RECORDING_TYPES } from 'shared/constants';

import { VaccineGivenForm } from './VaccineGivenForm';
import { VaccineNotGivenForm } from './VaccineNotGivenForm';
import { getCurrentUser } from '../store/auth';
import { findVaccinesByAdministeredStatus } from '../utils/findVaccinesByAdministeredStatus';

export const VaccineForm = ({ onCancel, onSubmit, getScheduledVaccines, vaccineRecordType }) => {
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

  return vaccineRecordType === VACCINE_RECORDING_TYPES.GIVEN ? (
    <VaccineGivenForm {...baseProps} />
  ) : (
    <VaccineNotGivenForm {...baseProps} />
  );
};

VaccineForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  getScheduledVaccines: PropTypes.func.isRequired,
  vaccineRecordType: PropTypes.string.isRequired,
};
