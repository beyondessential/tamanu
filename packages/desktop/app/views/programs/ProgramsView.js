import React, { useEffect, useCallback } from 'react';

import { connect } from 'react-redux';
import { connectApi } from 'desktop/app/api';

import { clearPatient } from 'desktop/app/store/patient';

import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { SurveySelector } from 'desktop/app/views/programs/SurveySelector';
import { LoadingIndicator } from 'desktop/app/components/LoadingIndicator';

const DumbSurveyFlow = React.memo(({ 
  onFetchSurvey, 
  onSubmitSurvey,
  onFetchProgramsList,
  patient,
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

  return (
    <SurveyView 
      onSubmit={onSubmit} 
      survey={survey}
      onCancel={onCancelSurvey} 
    />
  );
});

const SurveyFlow = connectApi((api, state, dispatch, props) => ({
  onFetchSurvey: id => api.get(`survey/${id}`),
  onFetchProgramsList: () => api.get('program'),
  onSubmitSurvey: (data) => api.post(`surveyResponse`, data),
}))(DumbSurveyFlow);

const PatientDisplay = connect(
  state => ({ patient: state.patient, }),
  dispatch => ({ onClearPatient: () => dispatch(clearPatient()) }),
)(React.memo(({ patient, onClearPatient }) => {
  const forInfo = `For ${patient.firstName} ${patient.lastName} (${patient.displayId})`;

  return (<p>{forInfo}<button onClick={onClearPatient}>change patient</button></p>);
}));

const DumbPatientLinker = React.memo(({ patient, patientId }) => {
  if(!patientId) {
    return "No patient selected.";
  }

  return <div>
    <PatientDisplay />
    <SurveyFlow patient={patient} />
  </div>;
});

export const ProgramsView = connect(state => ({
  patientId: state.patient.id,
  patient: state.patient,
}))(DumbPatientLinker);

