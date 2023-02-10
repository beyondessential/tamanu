import React, { useCallback } from 'react';

import { VACCINE_STATUS } from 'shared/constants';

import { Modal } from './Modal';

import { ImmunisationForm } from '../forms/ImmunisationForm';
import { useApi } from '../api';
import { usePatient } from '../contexts/Patient';

export const ImmunisationModal = ({ open, onClose, patientId }) => {
  const api = useApi();
  const { loadPatient } = usePatient();
  
  const onCreateImmunisation = useCallback(async data => {
    await api.post(`patient/${patientId}/administeredVaccine`, {
      ...data,
      patientId,
      status: VACCINE_STATUS.GIVEN,
    });
    loadPatient(patientId);
  }, [api, dispatch, patientId]);

  const getScheduledVaccines = useCallback(
    async query => api.get(`patient/${patientId}/scheduledVaccines`, query),
    [api, patientId]
  );
  
  return (
    <Modal title="Give vaccine" open={open} onClose={onClose}>
      <ImmunisationForm
        onSubmit={onCreateImmunisation}
        onCancel={onClose}
        getScheduledVaccines={getScheduledVaccines}
      />
    </Modal>
  );
}