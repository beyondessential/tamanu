import React, { useEffect, useState } from 'react';
import { useApi } from '../../api';
import { Dialog, Field, SelectField, TranslatedReferenceData } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { uniqBy } from 'lodash';

export const VaccineField = ({ name = 'vaccine', required, parameterValues }) => {
  const api = useApi();
  const { category } = parameterValues;
  const [vaccines, setVaccines] = useState([]);
  const [error, setError] = useState(null);
  const [isErrorDialogVisible, setIsErrorDialogVisible] = useState(false);

  useEffect(() => {
    if (!category) {
      return;
    }
    const scheduledVaccinesToOptions = async () => {
      try {
        const scheduledVaccines = await api.get(`scheduledVaccine`, { category });
        const uniqueByName = uniqBy(scheduledVaccines, 'label');
        setError(null);
        setVaccines(uniqueByName);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError(e.message);
        setIsErrorDialogVisible(true);
        setVaccines([]);
      }
    };

    scheduledVaccinesToOptions();
  }, [api, category]);

  return (
    <>
      <Field
        name={name}
        label={<TranslatedText stringId="vaccine.vaccine.label" fallback="Vaccine" />}
        component={SelectField}
        required={required}
        options={vaccines.map(vaccine => ({
          label: (
            <TranslatedReferenceData
              fallback={vaccine.label}
              value={vaccine.id}
              category="scheduledVaccine"
            />
          ),
          value: vaccine.label,
        }))}
      />
      <Dialog
        headerTitle={<TranslatedText stringId="general.error" fallback="Error" />}
        isVisible={isErrorDialogVisible}
        onClose={() => setIsErrorDialogVisible(false)}
        contentText={`Error occurred when fetching vaccine types: ${error}`}
      />
    </>
  );
};
