import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { VACCINE_STATUS, VACCINE_RECORDING_TYPES } from 'shared/constants';

import { Modal } from './Modal';
import { VaccineForm } from '../forms/VaccineForm';
import { SegmentTabDisplay } from './SegmentTabDisplay';
import { useApi } from '../api';
import { reloadPatient } from '../store/patient';
import { getCurrentUser } from '../store/auth';

export const VaccineModal = ({ open, onClose, patientId }) => {
  const [currentTabKey, setCurrentTabKey] = useState(VACCINE_RECORDING_TYPES.GIVEN);

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
        vaccineRecordingType: currentTabKey,
      });
      dispatch(reloadPatient(patientId));
    },
    [api, dispatch, patientId, currentUser.id, currentTabKey],
  );

  const getScheduledVaccines = useCallback(
    async query => api.get(`patient/${patientId}/scheduledVaccines`, query),
    [api, patientId],
  );

  const TABS = [
    {
      label: 'Given',
      key: VACCINE_RECORDING_TYPES.GIVEN,
      render: () => (
        <VaccineForm
          onSubmit={handleCreateVaccine}
          onCancel={onClose}
          getScheduledVaccines={getScheduledVaccines}
          vaccineRecordingType={VACCINE_RECORDING_TYPES.GIVEN}
        />
      ),
    },
    {
      label: 'Not given',
      key: VACCINE_RECORDING_TYPES.NOT_GIVEN,
      render: () => (
        <VaccineForm
          onSubmit={handleCreateVaccine}
          onCancel={onClose}
          getScheduledVaccines={getScheduledVaccines}
          vaccineRecordingType={VACCINE_RECORDING_TYPES.NOT_GIVEN}
        />
      ),
    },
  ];

  return (
    <Modal title="Record vaccine" open={open} onClose={onClose}>
      <SegmentTabDisplay
        tabs={TABS}
        currentTabKey={currentTabKey}
        onTabSelect={setCurrentTabKey}
        singleTabStyle={{ minWidth: '263px' }}
      />
    </Modal>
  );
};
