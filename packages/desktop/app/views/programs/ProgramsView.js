import React, { useEffect, useCallback } from 'react';

import { connect } from 'react-redux';
import { connectApi } from 'desktop/app/api';

import { reloadPatient } from 'desktop/app/store/patient';
import { getCurrentUser } from 'desktop/app/store/auth';

import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { ProgramSurveySelector } from 'desktop/app/views/programs/ProgramSurveySelector';
import { LoadingIndicator } from 'desktop/app/components/LoadingIndicator';
import { DumbPatientListingView } from 'desktop/app/views/patients/PatientListingView';
import { SURVEY_TYPES } from 'shared/constants';

const DumbSurveyFlow = React.memo(
  ({ onFetchSurvey, onSubmitSurvey, onFetchProgramsList, onFetchSurveysList, patient, currentUser }) => {
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
      const response = await onFetchSurvey(encodeURIComponent(id));
      setSurvey(response);
      setStartTime(new Date());
    });

    const onCancelSurvey = useCallback(() => {
      setSurvey(null);
    });

    const onSubmit = useCallback(
      data => onSubmitSurvey({
        surveyId: survey.id,
        startTime: startTime,
        patientId: patient.id,
        endTime: new Date(),
        answers: data,
      }),
      [startTime, survey, patient],
    );

    if (!programsList) {
      return <LoadingIndicator />;
    }

    if (!survey) {
      return (
        <ProgramSurveySelector
          programs={programsList}
          onSelectSurvey={onSelectSurvey}
          onFetchSurveysList={onFetchSurveysList}
        />
      );
    }

    return <SurveyView onSubmit={onSubmit} survey={survey} onCancel={onCancelSurvey} patient={patient} currentUser={currentUser} />;
  },
);

const SurveyFlow = connectApi(api => ({
  onFetchSurvey: id => api.get(`survey/${id}`),
  onFetchProgramsList: () => api.get('program'),
  onFetchSurveysList: async programId => {
    const surveys = await api.get(`program/${programId}/surveys`);
    return surveys.data.filter(x => x.surveyType === SURVEY_TYPES.PROGRAMS);
  },
  onSubmitSurvey: data => api.post(`surveyResponse`, data),
}))(DumbSurveyFlow);

const DumbPatientLinker = React.memo(({ patient, patientId, onViewPatient, currentUser }) => {
  if (!patientId) {
    return <DumbPatientListingView onViewPatient={onViewPatient} />;
  }

  return <SurveyFlow patient={patient} currentUser={currentUser} />;
});

export const ProgramsView = connect(
  state => ({
    patientId: state.patient.id,
    patient: state.patient,
    currentUser: getCurrentUser(state),
  }),
  dispatch => ({
    onViewPatient: id => dispatch(reloadPatient(id)),
  }),
)(DumbPatientLinker);
