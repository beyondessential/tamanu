import React, { useCallback } from 'react';
import { VACCINE_STATUS, VACCINE_RECORDING_TYPES } from 'shared/constants';
import { useDispatch } from 'react-redux';
import { Modal } from './Modal';
import { useApi } from '../api';
import { reloadPatient } from '../store/patient';
import { ViewAdministeredVaccineContent } from './ViewAdministeredVaccineModal';
import { VaccineForm } from '../forms/VaccineForm';

export const EditAdministeredVaccineModal = ({ open, onClose, patientId, vaccineRecord }) => {
  const api = useApi();
  const dispatch = useDispatch();

  const handleUpdateVaccine = useCallback(
    async data => {
      await api.put(`patient/${patientId}/administeredVaccine/${vaccineRecord.id}`, {
        ...data,
        circumstanceIds: data.circumstanceIds?.split(',').map(c => c.trim()),
      });
      dispatch(reloadPatient(patientId));
    },
    [api, dispatch, patientId, vaccineRecord],
  );

  if (!vaccineRecord) return null;

  const notGiven = VACCINE_STATUS.NOT_GIVEN === vaccineRecord?.status;

  return (
    <Modal title="Edit vaccine" open={open} onClose={onClose}>
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
