import React, { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { useApi } from 'desktop/app/api';
import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { PatientListingView } from 'desktop/app/views';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { SURVEY_TYPES } from 'shared/constants';

import { SurveySelector } from '../programs/SurveySelector';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from '../programs/ProgramsPane';
import { getCurrentUser } from '../../store';
import { getAnswersFromData, getActionsFromData } from '../../utils';
import { usePatient } from '../../contexts/Patient';

const ReferralFlow = ({ patient, currentUser }) => {
  const api = useApi();
  const [referralSurvey, setReferralSurvey] = useState(null);
  const [referralSurveys, setReferralSurveys] = useState(null);
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

  const submitReferral = useCallback(
    data => {
      api.post('referral', {
        surveyId: referralSurvey.id,
        startTime,
        patientId: patient.id,
        endTime: getCurrentDateTimeString(),
        answers: getAnswersFromData(data, referralSurvey),
        actions: getActionsFromData(data, referralSurvey),
      });
    },
    [api, referralSurvey, startTime, patient],
  );

  if (!referralSurvey) {
    return (
      <ProgramsPane>
        <ProgramsPaneHeader>
          <ProgramsPaneHeading variant="h6">Select a referral</ProgramsPaneHeading>
        </ProgramsPaneHeader>
        <FormGrid columns={1}>
          <SurveySelector
            onSelectSurvey={setSelectedReferral}
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
  const { patient, loadPatient } = usePatient();
  const currentUser = useSelector(getCurrentUser);
  if (!patient.id) {
    return <PatientListingView onViewPatient={loadPatient} />;
  }

  return <ReferralFlow patient={patient} currentUser={currentUser} />;
};
