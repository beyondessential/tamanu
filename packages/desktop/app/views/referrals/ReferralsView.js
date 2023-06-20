import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { useApi } from 'desktop/app/api';
import { reloadPatient } from 'desktop/app/store/patient';
import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { PatientListingView } from 'desktop/app/views';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { SURVEY_TYPES } from 'shared/constants';

import { SurveySelector } from '../programs/SurveySelector';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from '../programs/ProgramsPane';
import { getCurrentUser } from '../../store';
import { getAnswersFromData, getActionsFromData } from '../../utils';
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
      actions: getActionsFromData(data, referralSurvey),
    });

    navigateToPatient(patient.id, { tab: PATIENT_TABS.REFERRALS });
  };

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
