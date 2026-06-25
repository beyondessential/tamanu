import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';

import { VACCINE_RECORDING_TYPES } from '@tamanu/constants';

import { FormModal } from './FormModal';
import { VaccineForm } from '../forms/VaccineForm';
import { SegmentTabDisplay } from './SegmentTabDisplay';
import { useApi, useSuggester } from '../api';
import { reloadPatient } from '../store/patient';
import { getCurrentUser } from '../store/auth';
import { TranslatedText } from './Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';
import { AI_PATIENT_SUMMARY_QUERY_KEY } from '../api/queries/useAiPatientSummaryQuery';

export const VaccineModal = ({ open, onClose, patientId, vaccineRecord }) => {
  const [currentTabKey, setCurrentTabKey] = useState(VACCINE_RECORDING_TYPES.GIVEN);

  const api = useApi();
  const queryClient = useQueryClient();
  const { facilityId } = useAuth();
  const countrySuggester = useSuggester('country');
  const dispatch = useDispatch();
  const currentUser = useSelector(getCurrentUser);

  const handleCreateVaccine = useCallback(
    async (data) => {
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

      const body = {
        ...dataToSubmit,
        patientId,
        status: currentTabKey,
        recorderId: currentUser.id,
        facilityId,
      };
      if (dataToSubmit.circumstanceIds) {
        body.circumstanceIds = JSON.parse(dataToSubmit.circumstanceIds);
      }

      await api.post(`patient/${patientId}/administeredVaccine`, body);
      queryClient.invalidateQueries([AI_PATIENT_SUMMARY_QUERY_KEY, patientId]);
      console.log('invalidated ai patient summary query', patientId);
      dispatch(reloadPatient(patientId));
    },
    [
      api,
      dispatch,
      patientId,
      currentUser.id,
      currentTabKey,
      countrySuggester,
      facilityId,
      queryClient,
    ],
  );

  const getScheduledVaccines = useCallback(
    async (query) => api.get(`patient/${patientId}/scheduledVaccines`, query),
    [api, patientId],
  );

  const TABS = [
    {
      label: (
        <TranslatedText
          stringId="vaccine.property.status.given"
          fallback="Given"
          data-testid="translatedtext-2e3y"
        />
      ),
      key: VACCINE_RECORDING_TYPES.GIVEN,
      render: () => (
        <VaccineForm
          onSubmit={handleCreateVaccine}
          onCancel={onClose}
          patientId={patientId}
          getScheduledVaccines={getScheduledVaccines}
          vaccineRecordingType={VACCINE_RECORDING_TYPES.GIVEN}
          existingValues={vaccineRecord}
          data-testid="vaccineform-0k3p"
        />
      ),
    },
    {
      label: (
        <TranslatedText
          stringId="vaccine.property.status.notGiven"
          fallback="Not given"
          data-testid="translatedtext-ju96"
        />
      ),
      key: VACCINE_RECORDING_TYPES.NOT_GIVEN,
      render: () => (
        <VaccineForm
          onSubmit={handleCreateVaccine}
          onCancel={onClose}
          patientId={patientId}
          getScheduledVaccines={getScheduledVaccines}
          vaccineRecordingType={VACCINE_RECORDING_TYPES.NOT_GIVEN}
          existingValues={vaccineRecord}
          data-testid="vaccineform-e7qk"
        />
      ),
    },
  ];

  return (
    <FormModal
      title={
        <TranslatedText
          stringId="vaccine.modal.create.title"
          fallback="Record vaccine"
          data-testid="translatedtext-w6y6"
        />
      }
      open={open}
      onClose={onClose}
      width="md"
      data-testid="formmodal-82as"
    >
      <SegmentTabDisplay
        tabs={TABS}
        currentTabKey={currentTabKey}
        onTabSelect={setCurrentTabKey}
        data-testid="segmenttabdisplay-c1t9"
      />
    </FormModal>
  );
};
