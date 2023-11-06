import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { VACCINE_RECORDING_TYPES } from '@tamanu/constants';

import { Modal } from './Modal';
import { VaccineForm } from '../forms/VaccineForm';
import { SegmentTabDisplay } from './SegmentTabDisplay';
import { useApi, useSuggester } from '../api';
import { reloadPatient } from '../store/patient';
import { getCurrentUser } from '../store/auth';
import { TranslatedText } from './Translation/TranslatedText';

export const VaccineModal = ({ open, onClose, patientId }) => {
  const [currentTabKey, setCurrentTabKey] = useState(VACCINE_RECORDING_TYPES.GIVEN);

  const api = useApi();
  const countrySuggester = useSuggester('country');
  const dispatch = useDispatch();
  const currentUser = useSelector(getCurrentUser);

  const handleCreateVaccine = useCallback(
    async data => {
      const dataToSubmit = { ...data };
      if (currentTabKey === VACCINE_RECORDING_TYPES.GIVEN && data.givenElsewhere && data.givenBy) {
        const givenByCountry = (await countrySuggester.fetchCurrentOption(data.givenBy))?.label;
        dataToSubmit.givenBy = givenByCountry;
      }

      if (dataToSubmit.givenElsewhere) {
        delete dataToSubmit.departmentId;
        delete dataToSubmit.locationGroupId;
        delete dataToSubmit.locationId;
      }

      await api.post(`patient/${patientId}/administeredVaccine`, {
        ...dataToSubmit,
        patientId,
        status: currentTabKey,
        recorderId: currentUser.id,
        circumstanceIds: dataToSubmit.circumstanceIds?.split(',').map(c => c.trim()),
      });
      dispatch(reloadPatient(patientId));
    },
    [api, dispatch, patientId, currentUser.id, currentTabKey, countrySuggester],
  );

  const getScheduledVaccines = useCallback(
    async query => api.get(`patient/${patientId}/scheduledVaccines`, query),
    [api, patientId],
  );

  const TABS = [
    {
      label: <TranslatedText stringId="vaccine.form.tab.given" fallback="Given" />,
      key: VACCINE_RECORDING_TYPES.GIVEN,
      render: () => (
        <VaccineForm
          onSubmit={handleCreateVaccine}
          onCancel={onClose}
          patientId={patientId}
          getScheduledVaccines={getScheduledVaccines}
          vaccineRecordingType={VACCINE_RECORDING_TYPES.GIVEN}
        />
      ),
    },
    {
      label: <TranslatedText stringId="vaccine.form.tab.notGiven" fallback="Not Given" />,
      key: VACCINE_RECORDING_TYPES.NOT_GIVEN,
      render: () => (
        <VaccineForm
          onSubmit={handleCreateVaccine}
          onCancel={onClose}
          patientId={patientId}
          getScheduledVaccines={getScheduledVaccines}
          vaccineRecordingType={VACCINE_RECORDING_TYPES.NOT_GIVEN}
        />
      ),
    },
  ];

  return (
    <Modal
      title={<TranslatedText stringId="vaccine.modal.create.title" fallback="Record vaccine" />}
      open={open}
      onClose={onClose}
      cornerExitButton={false}
    >
      <SegmentTabDisplay tabs={TABS} currentTabKey={currentTabKey} onTabSelect={setCurrentTabKey} />
    </Modal>
  );
};
