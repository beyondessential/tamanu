import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { useApi } from 'desktop/app/api';
import { reloadPatient } from 'desktop/app/store/patient';
import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { DumbPatientListingView } from 'desktop/app/views/patients/PatientListingView';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { SURVEY_TYPES } from 'shared/constants';

import { SurveySelector } from '../programs/SurveySelector';
import { PatientDisplay } from '../programs/PatientDisplay';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from '../programs/ProgramsPane';
import { getCurrentUser } from '../../store';
import { getAnswersFromData, getActionsFromData } from '../../utils';

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
  }, []);

  const onSelectReferralSurvey = useCallback(async id => {
    const response = await api.get(`survey/${encodeURIComponent(id)}`);
    setReferralSurvey(response);
    setStartTime(new Date());
  });

  const onCancelReferral = useCallback(() => {
    setReferralSurvey(null);
  });

  const onSubmit = useCallback(
    data => {
      api.post('referral', {
        surveyId: referralSurvey.id,
        startTime: startTime,
        patientId: patient.id,
        endTime: new Date(),
        answers: getAnswersFromData(data, referralSurvey),
        actions: getActionsFromData(data, referralSurvey),
      });
    },
    [startTime, referralSurvey],
  );

  if (!referralSurvey) {
    return (
      <>
        <PatientDisplay />
        <ProgramsPane>
          <ProgramsPaneHeader>
            <ProgramsPaneHeading variant="h6">Select a referral</ProgramsPaneHeading>
          </ProgramsPaneHeader>
          <FormGrid columns={1}>
            <SurveySelector
              onSelectSurvey={onSelectReferralSurvey}
              surveys={referralSurveys}
              buttonText="Begin referral"
            />
          </FormGrid>
        </ProgramsPane>
      </>
    );
  }

  return (
    <SurveyView
      onSubmit={onSubmit}
      survey={referralSurvey}
      onCancel={onCancelReferral}
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
      <DumbPatientListingView
        onViewPatient={id => {
          dispatch(reloadPatient(id));
        }}
      />
    );
  }

  return <ReferralFlow patient={patient} currentUser={currentUser} />;
};
