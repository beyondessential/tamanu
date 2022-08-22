import React, { useState, useEffect } from 'react';
import { useApi } from '../../api';
import { SelectField, Field, Dialog } from '../../components';

export const VaccineField = ({ name = 'vaccine', required, parameterValues }) => {
  const api = useApi();
  const { category } = parameterValues;
  const [vaccineOptions, setVaccineOptions] = useState([]);
  const [error, setError] = useState(null);
  const [isErrorDialogVisible, setIsErrorDialogVisible] = useState(false);

  useEffect(() => {
    if (!category) {
      return;
    }
    const scheduledVaccinesToOptions = async () => {
      try {
        const scheduledVaccines = await api.get(`scheduledVaccine`, { category });
        const vaccineNames = [...new Set(scheduledVaccines.map(vaccine => vaccine.label))];
        const options = vaccineNames.map(vaccineName => ({
          label: vaccineName,
          value: vaccineName,
        }));
        setError(null);
        setVaccineOptions(options);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError(e.message);
        setIsErrorDialogVisible(true);
        setVaccineOptions([]);
      }
    };

    scheduledVaccinesToOptions();
  }, [api, category]);

  return (
    <>
      <Field
        name={name}
        label="Vaccine"
        component={SelectField}
        required={required}
        options={vaccineOptions}
      />
      <Dialog
        headerTitle="Error"
        isVisible={isErrorDialogVisible}
        onClose={() => setIsErrorDialogVisible(false)}
        contentText={`Error occurred when fetching vaccine types: ${error}`}
      />
    </>
  );
};
