import React, { useState, useEffect } from 'react';
import { useApi } from '../../api';
import { SelectField, Field, Dialog } from '../../components';

export const LabTestTypeField = ({ name = 'labTestType', required, parameterValues }) => {
  const api = useApi();
  const { category } = parameterValues;
  const [testOptions, setTestOptions] = useState([]);
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
        setTestOptions(options);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError(e.message);
        setIsErrorDialogVisible(true);
        setTestOptions([]);
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
        options={testOptions}
      />
      <Dialog
        headerTitle="Error"
        isVisible={isErrorDialogVisible}
        onClose={() => setIsErrorDialogVisible(false)}
        contentText={`Error occurred when fetching lab test types: ${error}`}
      />
    </>
  );
};
