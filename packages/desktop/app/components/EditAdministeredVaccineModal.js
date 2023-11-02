import React, { useCallback } from 'react';
import { VACCINE_STATUS, VACCINE_RECORDING_TYPES } from '@tamanu/constants';
import { useDispatch } from 'react-redux';
import { Modal } from './Modal';
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
    async data => {
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
          : newData.circumstanceIds?.split(',').map(c => c.trim()),
      });
      dispatch(reloadPatient(patientId));
    },
    [api, dispatch, patientId, vaccineRecord, countrySuggester],
  );

  if (!vaccineRecord) return null;

  const notGiven = VACCINE_STATUS.NOT_GIVEN === vaccineRecord?.status;

  return (
    <Modal
      title={<TranslatedText stringId="vaccine.form.editTitle" fallback="Edit vaccine record" />}
      open={open}
      onClose={onClose}
      cornerExitButton={false}
    >
      <ViewAdministeredVaccineContent vaccineRecord={vaccineRecord} editMode />
      <VaccineForm
        onSubmit={handleUpdateVaccine}
        onCancel={onClose}
        patientId={patientId}
        editMode
        currentVaccineRecordValues={vaccineRecord}
        vaccineRecordingType={
          notGiven ? VACCINE_RECORDING_TYPES.NOT_GIVEN : VACCINE_RECORDING_TYPES.GIVEN
        }
      />
    </Modal>
  );
};
