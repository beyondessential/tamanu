import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { VaccineGivenForm } from './VaccineGivenForm';
import { VaccineNotGivenForm } from './VaccineNotGivenForm';
import { getCurrentUser } from '../store/auth';
import { findVaccinesByAdministeredStatus } from '../utils/findVaccinesByAdministeredStatus';

export const VaccineForm = ({ onCancel, onSubmit, getScheduledVaccines, vaccineCreationType }) => {
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

    // eslint-disable-next-line no-console
    fetchScheduledVaccines().catch(err => console.error(err));
  }, [category, getScheduledVaccines]);

  return vaccineCreationType === 'given' ? (
    <VaccineGivenForm
      vaccineLabel={vaccineLabel}
      vaccineOptions={vaccineOptions}
      category={category}
      setCategory={setCategory}
      setVaccineLabel={setVaccineLabel}
      administeredOptions={administeredOptions}
      scheduleOptions={scheduleOptions}
      onSubmit={onSubmit}
      onCancel={onCancel}
      currentUser={currentUser}
    />
  ) : (
    <VaccineNotGivenForm
      vaccineLabel={vaccineLabel}
      vaccineOptions={vaccineOptions}
      category={category}
      setCategory={setCategory}
      setVaccineLabel={setVaccineLabel}
      administeredOptions={administeredOptions}
      scheduleOptions={scheduleOptions}
      onSubmit={onSubmit}
      onCancel={onCancel}
      currentUser={currentUser}
    />
  );
};
