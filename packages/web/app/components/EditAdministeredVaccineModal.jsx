import React, { useCallback } from 'react';
import { VACCINE_RECORDING_TYPES, VACCINE_STATUS } from '@tamanu/constants';
import { useDispatch } from 'react-redux';
import { FormModal } from './FormModal';
import { useApi, useSuggester } from '../api';
import { reloadPatient } from '../store/patient';
import { ViewAdministeredVaccineContent } from './ViewAdministeredVaccineModal';
import { VaccineForm } from '../forms/VaccineForm';
import { TranslatedText } from './Translation/TranslatedText';

export const EditAdministeredVaccineModal = ({ open, onClose, patientId, vaccineRecord }) => {
  const api = useApi();
  const dispatch = useDispatch();
  const countrySuggester = useSuggester('country');

  const handleUpdateVaccine = useCallback(
    async (data) => {
      const newData = { ...data };
      if (
        newData.status === VACCINE_RECORDING_TYPES.GIVEN &&
        newData.givenElsewhere &&
        newData.givenBy &&
        vaccineRecord.givenBy !== newData.givenBy
      ) {
        const givenByCountry = (await countrySuggester.fetchCurrentOption(newData.givenBy))?.label;
        newData.givenBy = givenByCountry;
      }
      await api.put(`patient/${patientId}/administeredVaccine/${vaccineRecord.id}`, {
        ...newData,
        circumstanceIds: Array.isArray(newData.circumstanceIds)
          ? newData.circumstanceIds
          : JSON.parse(newData.circumstanceIds),
      });
      dispatch(reloadPatient(patientId));
    },
    [api, dispatch, patientId, vaccineRecord, countrySuggester],
  );

  if (!vaccineRecord) return null;

  const notGiven = VACCINE_STATUS.NOT_GIVEN === vaccineRecord?.status;

  return (
    <FormModal
      title={
        <TranslatedText
          stringId="vaccine.modal.edit.title"
          fallback="Edit vaccine record"
          data-testid="translatedtext-kegh"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="formmodal-wu6m"
    >
      <ViewAdministeredVaccineContent
        vaccineRecord={vaccineRecord}
        editMode
        data-testid="viewadministeredvaccinecontent-4hf5"
      />
      <VaccineForm
        onSubmit={handleUpdateVaccine}
        onCancel={onClose}
        patientId={patientId}
        editMode
        existingValues={vaccineRecord}
        vaccineRecordingType={
          notGiven ? VACCINE_RECORDING_TYPES.NOT_GIVEN : VACCINE_RECORDING_TYPES.GIVEN
        }
        data-testid="vaccineform-fx1e"
      />
    </FormModal>
  );
};
