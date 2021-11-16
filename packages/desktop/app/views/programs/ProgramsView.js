import React, { useState, useEffect, useCallback } from 'react';

import { useSelector, useDispatch } from 'react-redux';
import { useApi } from 'desktop/app/api';

import { reloadPatient } from 'desktop/app/store/patient';
import { getCurrentUser } from 'desktop/app/store/auth';

import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { ProgramSurveySelector } from 'desktop/app/views/programs/ProgramSurveySelector';
import { LoadingIndicator } from 'desktop/app/components/LoadingIndicator';
import { DumbPatientListingView } from 'desktop/app/views/patients/PatientListingView';
import { getAnswersFromData, getActionsFromData } from '../../utils';

const SurveyFlow = ({ patient, currentUser }) => {
  const api = useApi();
  const [survey, setSurvey] = useState(null);
  const [programsList, setProgramsList] = useState(null);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.get('program');
      setProgramsList(data);
    })();
  }, []);

  const onSelectSurvey = useCallback(async id => {
    const response = await api.get(`survey/${encodeURIComponent(id)}`);
    setSurvey(response);
    setStartTime(new Date());
  });

  const onCancelSurvey = useCallback(() => {
    setSurvey(null);
  });

  const onSubmit = useCallback(
    data =>
      api.post('surveyResponse', {
        surveyId: survey.id,
        startTime: startTime,
        patientId: patient.id,
        endTime: new Date(),
        answers: getAnswersFromData(data, survey),
        actions: getActionsFromData(data, survey),
      }),
    [startTime, survey, patient],
  );

  if (!programsList) {
    return <LoadingIndicator />;
  }

  if (!survey) {
    return <ProgramSurveySelector programs={programsList} onSelectSurvey={onSelectSurvey} />;
  }

  return (
    <SurveyView
      onSubmit={onSubmit}
      survey={survey}
      onCancel={onCancelSurvey}
      patient={patient}
      currentUser={currentUser}
    />
  );
};

export const ProgramsView = () => {
  const dispatch = useDispatch();
  const patient = useSelector(state => state.patient);
  const currentUser = useSelector(getCurrentUser);
  if (!patient.id) {
    return <DumbPatientListingView onViewPatient={id => dispatch(reloadPatient(id))} />;
  }

  return <SurveyFlow patient={patient} currentUser={currentUser} />;
};
