import React, { useEffect, useCallback } from 'react';

import { connectApiAndState } from 'desktop/app/api';

import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { SurveySelector } from 'desktop/app/views/programs/SurveySelector';
import { LoadingIndicator } from 'desktop/app/components/LoadingIndicator';

const DumbProgramsView = React.memo(({ 
  onFetchSurvey, 
  onSubmitSurvey,
  onFetchProgramsList,
  patient,
  visit,
}) => {
  const [survey, setSurvey] = React.useState(null);
  const [programsList, setProgramsList] = React.useState(null);
  const [startTime, setStartTime] = React.useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await onFetchProgramsList();
      setProgramsList(data);
    })();
  }, []);

  const onSelectSurvey = useCallback(async id => {
    const response = await onFetchSurvey(id);
    setSurvey(response);
    setStartTime(new Date());
  });

  const onCancelSurvey = useCallback(() => {
    setSurvey(null);
  });

  const onSubmit = useCallback(data => {
    onSubmitSurvey({
      surveyId: survey._id,
      startTime: startTime,
      patientId: patient._id,
      visitId: visit._id,
      endTime: new Date(),
      answers: data,
    });
  }, [startTime, survey]);

  if (!programsList) {
    return <LoadingIndicator loadingText="Loading survey list..." />;
  }

  if (!survey) {
    return <SurveySelector programs={programsList} onSelectSurvey={onSelectSurvey} />;
  }

  const forInfo = `For ${patient.firstName} ${patient.lastName} (${patient.displayId})`;

  return (
    <SurveyView 
      forInfo={forInfo}
      onSubmit={onSubmit} 
      survey={survey}
      onCancel={onCancelSurvey} 
    />
  );
});

export const ProgramsView = connectApiAndState((api, state, dispatch, props) => ({
  onFetchSurvey: id => api.get(`survey/${id}`),
  onFetchProgramsList: () => api.get('program'),
  onSubmitSurvey: (data) => api.post(`surveyResponse`, data),
  patient: state.patient,
  visit: state.visit,
}))(DumbProgramsView);
