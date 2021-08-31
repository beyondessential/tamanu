import React, { useState, useEffect } from 'react';
import { connectApi } from '../../api';
import { SelectField, Field, Dialog } from '../../components';

const DumbVaccineField = ({ required, getScheduledVaccines, parameterValues }) => {
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
        const scheduledVaccines = await getScheduledVaccines({ category });
        const vaccineNames = [...new Set(scheduledVaccines.map(vaccine => vaccine.label))];
        const options = vaccineNames.map(vaccineName => ({
          label: vaccineName,
          value: vaccineName,
        }));
        setError(null);
        setVaccineOptions(options);
      } catch (e) {
        console.error(e);
        setError(e.message);
        setIsErrorDialogVisible(true);
        setVaccineOptions([]);
      }
    };

    scheduledVaccinesToOptions();
  }, [category]);

  return (
    <>
      <Field
        name="vaccine"
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

export const VaccineField = connectApi((api, dispatch, { category }) => {
  return {
    getScheduledVaccines: async query => api.get(`scheduledVaccine`, query),
    category,
  };
})(DumbVaccineField);
