import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { SURVEY_TYPES } from '@tamanu/constants';

import { useApi } from '../../api';
import { reloadPatient } from '../../store/patient';
import { SurveyView } from '../programs/SurveyView';
import { PatientListingView } from '..';
import { FormGrid } from '../../components/FormGrid';
import { usePatientAdditionalDataQuery } from '../../api/queries';
import { ErrorMessage } from '../../components/ErrorMessage';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { SurveySelector } from '../programs/SurveySelector';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from '../programs/ProgramsPane';
import { getCurrentUser } from '../../store';
import { getAnswersFromData } from '../../utils';
import { PATIENT_TABS } from '../../constants/patientPaths';
import { usePatientNavigation } from '../../utils/usePatientNavigation';

const ReferralFlow = ({ patient, currentUser }) => {
  const api = useApi();
  const { navigateToPatient } = usePatientNavigation();
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
