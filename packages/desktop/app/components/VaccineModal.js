import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { VACCINE_STATUS } from 'shared/constants';

import { Modal } from './Modal';
import { VaccineForm } from '../forms/VaccineForm';
import { SegmentTabDisplay } from './SegmentTabDisplay';
import { useApi } from '../api';
import { reloadPatient } from '../store/patient';
import { getCurrentUser } from '../store/auth';

export const VaccineModal = ({ open, onClose, patientId }) => {
  const [currentTab, setCurrentTab] = useState('given');

  const api = useApi();
  const dispatch = useDispatch();
  const currentUser = useSelector(getCurrentUser);

  const handleCreateVaccine = useCallback(
    async data => {
      await api.post(`patient/${patientId}/administeredVaccine`, {
        ...data,
        patientId,
        status: VACCINE_STATUS.GIVEN,
        recorderId: currentUser.id,
        vaccineCreationType: currentTab,
      });
      dispatch(reloadPatient(patientId));
    },
    [api, dispatch, patientId, currentUser.id, currentTab],
  );

  const getScheduledVaccines = useCallback(
    async query => api.get(`patient/${patientId}/scheduledVaccines`, query),
    [api, patientId],
  );

  const TABS = [
    {
      label: 'Given',
      key: 'given',
      render: () => (
        <VaccineForm
          onSubmit={handleCreateVaccine}
          onCancel={onClose}
          getScheduledVaccines={getScheduledVaccines}
          vaccineCreationType="given"
        />
      ),
    },
    {
      label: 'Not given',
      key: 2,
      render: () => (
        <VaccineForm
          onSubmit={handleCreateVaccine}
          onCancel={onClose}
          getScheduledVaccines={getScheduledVaccines}
          vaccineCreationType="notGiven"
        />
      ),
    },
  ];

  return (
    <Modal title="Give vaccine" open={open} onClose={onClose}>
      <SegmentTabDisplay tabs={TABS} currentTab={currentTab} onTabSelect={setCurrentTab} />
    </Modal>
  );
};
