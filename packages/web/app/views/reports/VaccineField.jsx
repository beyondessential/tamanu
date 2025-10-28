import React, { useEffect, useState } from 'react';
import { uniqBy } from 'lodash';
import {
  SelectField,
  TranslatedReferenceData,
  Dialog,
  TranslatedText,
} from '@tamanu/ui-components';
import { useApi } from '../../api';
import { Field } from '../../components';

export const VaccineField = ({ name = 'vaccine', required, label, parameterValues }) => {
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
        label={
          label ?? (
            <TranslatedText
              stringId="vaccine.vaccine.label"
              fallback="Vaccine"
              data-testid="translatedtext-v3er"
            />
          )
        }
        component={SelectField}
        required={required}
        options={vaccines.map(vaccine => ({
          label: (
            <TranslatedReferenceData
              fallback={vaccine.label}
              value={vaccine.id}
              category="scheduledVaccine"
              data-testid={`translatedreferencedata-sbfj-${vaccine.code}`}
            />
          ),
          value: vaccine.label,
        }))}
        data-testid="field-eliy"
      />
      <Dialog
        headerTitle={
          <TranslatedText
            stringId="general.error"
            fallback="Error"
            data-testid="translatedtext-w1ah"
          />
        }
        isVisible={isErrorDialogVisible}
        onClose={() => setIsErrorDialogVisible(false)}
        contentText={`Error occurred when fetching vaccine types: ${error}`}
        data-testid="dialog-yzkf"
      />
    </>
  );
};
