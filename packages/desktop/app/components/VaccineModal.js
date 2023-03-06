import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { VACCINE_STATUS, VACCINE_CREATION_TYPE } from 'shared/constants';

import { Modal } from './Modal';
import { VaccineForm } from '../forms/VaccineForm';
import { SegmentTabDisplay } from './SegmentTabDisplay';
import { useApi } from '../api';
import { reloadPatient } from '../store/patient';
import { getCurrentUser } from '../store/auth';

export const VaccineModal = ({ open, onClose, patientId }) => {
  const [currentTabKey, setCurrentTabKey] = useState(VACCINE_CREATION_TYPE.GIVEN);

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
        vaccineCreationType: currentTabKey,
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
      key: VACCINE_CREATION_TYPE.GIVEN,
      render: () => (
        <VaccineForm
          onSubmit={handleCreateVaccine}
          onCancel={onClose}
          getScheduledVaccines={getScheduledVaccines}
          vaccineCreationType={VACCINE_CREATION_TYPE.GIVEN}
        />
      ),
    },
    {
      label: 'Not given',
      key: VACCINE_CREATION_TYPE.NOT_GIVEN,
      render: () => (
        <VaccineForm
          onSubmit={handleCreateVaccine}
          onCancel={onClose}
          getScheduledVaccines={getScheduledVaccines}
          vaccineCreationType={VACCINE_CREATION_TYPE.NOT_GIVEN}
        />
      ),
    },
  ];

  return (
    <Modal title="Give vaccine" open={open} onClose={onClose}>
      <SegmentTabDisplay tabs={TABS} currentTabKey={currentTabKey} onTabSelect={setCurrentTabKey} />
    </Modal>
  );
};
