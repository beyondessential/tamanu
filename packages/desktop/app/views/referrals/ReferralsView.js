import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { SURVEY_TYPES } from '@tamanu/constants';

import { useApi } from 'desktop/app/api';
import { reloadPatient } from 'desktop/app/store/patient';
import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { PatientListingView } from 'desktop/app/views';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { usePatientAdditionalDataQuery } from 'desktop/app/api/queries';
import { ErrorMessage } from 'desktop/app/components/ErrorMessage';
import { LoadingIndicator } from 'desktop/app/components/LoadingIndicator';
import { SurveySelector } from 'desktop/app/views/programs/SurveySelector';
import {
  ProgramsPane,
  ProgramsPaneHeader,
  ProgramsPaneHeading,
} from 'desktop/app/views/programs/ProgramsPane';
import { getCurrentUser } from 'desktop/app/store';
import { getAnswersFromData, getActionsFromData } from 'desktop/app/utils';
import { PATIENT_TABS } from 'desktop/app/constants/patientPaths';
import { usePatientNavigation } from 'desktop/app/utils/usePatientNavigation';
import { useEncounter } from '../../contexts/Encounter';

const ReferralFlow = ({ patient, currentUser }) => {
  const api = useApi();
  const { navigateToPatient } = usePatientNavigation();
  const { encounter } = useEncounter();
  const [referralSurvey, setReferralSurvey] = useState(null);
  const [referralSurveys, setReferralSurveys] = useState(null);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    (async () => {
      const response = await api.get(`survey`, { type: SURVEY_TYPES.REFERRAL });
      setReferralSurveys(response.surveys.map(x => ({ value: x.id, label: x.name })));
    })();
  }, [api]);

  const setSelectedReferral = useCallback(
    async id => {
      const response = await api.get(`survey/${encodeURIComponent(id)}`);
      setReferralSurvey(response);
      setStartTime(getCurrentDateTimeString());
    },
    [api],
  );

  const unsetReferral = useCallback(() => {
    setReferralSurvey(null);
  }, []);

  const submitReferral = async data => {
    await api.post('referral', {
      surveyId: referralSurvey.id,
      startTime,
      patientId: patient.id,
      endTime: getCurrentDateTimeString(),
      answers: getAnswersFromData(data, referralSurvey),
      actions: getActionsFromData({ ...data, encounterType: encounter.type }, referralSurvey),
    });

    navigateToPatient(patient.id, { tab: PATIENT_TABS.REFERRALS });
  };

  const { isLoading, data: patientAdditionalData, isError, error } = usePatientAdditionalDataQuery(
    patient.id,
  );

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (isError) {
    return <ErrorMessage title="Error" error={error} />;
  }

  if (!referralSurvey) {
    return (
      <ProgramsPane>
        <ProgramsPaneHeader>
          <ProgramsPaneHeading variant="h6">Select a referral</ProgramsPaneHeading>
        </ProgramsPaneHeader>
        <FormGrid columns={1}>
          <SurveySelector
            onSubmit={setSelectedReferral}
            onChange={setSelectedSurveyId}
            value={selectedSurveyId}
            surveys={referralSurveys}
            buttonText="Begin referral"
          />
        </FormGrid>
      </ProgramsPane>
    );
  }
  return (
    <SurveyView
      onSubmit={submitReferral}
      survey={referralSurvey}
      onCancel={unsetReferral}
      patient={patient}
      patientAdditionalData={patientAdditionalData}
      currentUser={currentUser}
    />
  );
};

export const ReferralsView = () => {
  const patient = useSelector(state => state.patient);
  const currentUser = useSelector(getCurrentUser);
  const dispatch = useDispatch();
  if (!patient.id) {
    return (
      <PatientListingView
        onViewPatient={id => {
          dispatch(reloadPatient(id));
        }}
      />
    );
  }

  return <ReferralFlow patient={patient} currentUser={currentUser} />;
};
