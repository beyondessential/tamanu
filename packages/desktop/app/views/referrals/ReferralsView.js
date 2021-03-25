import React, { useEffect, useCallback } from 'react';

import { connect } from 'react-redux';
import { connectApi } from 'desktop/app/api';

import { reloadPatient } from 'desktop/app/store/patient';

import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { LoadingIndicator } from 'desktop/app/components/LoadingIndicator';
import { DumbPatientListingView } from 'desktop/app/views/patients/PatientListingView';
import { SurveySelector } from '../programs/SurveySelector';

const DumbSurveyFlow = React.memo(
  ({ onFetchSurvey, onSubmitSurvey, onFetchSurveysList, patient }) => {
    const [survey, setSurvey] = React.useState(null);
    const [startTime, setStartTime] = React.useState(null);

    const onSelectSurvey = useCallback(async id => {
      const response = await onFetchSurvey(encodeURIComponent(id));
      setSurvey(response);
      setStartTime(new Date());
    });

    const onCancelSurvey = useCallback(() => {
      setSurvey(null);
    });

    const onSubmit = useCallback(
      data => {
        onSubmitSurvey({
          surveyId: survey.id,
          startTime: startTime,
          patientId: patient.id,
          endTime: new Date(),
          answers: data,
        });
      },
      [startTime, survey],
    );

    // if (!programsList) {
    //   return <LoadingIndicator />;
    // }

    if (!survey) {
      return (
        <SurveySelector
          programs={null}
          onSelectSurvey={onSelectSurvey}
          onFetchSurveysList={onFetchSurveysList}
        />
      );
    }

    return <SurveyView onSubmit={onSubmit} survey={survey} onCancel={onCancelSurvey} />;
  },
);

const SurveyFlow = connectApi(api => ({
  onFetchSurvey: id => api.get(`survey/${id}`),
  onFetchSurveysList: () => api.get(`survey/referrals`),
  onSubmitSurvey: data => api.post(`surveyResponse`, data),
}))(DumbSurveyFlow);

const DumbPatientLinker = React.memo(({ patient, patientId, onViewPatient }) => {
  if (!patientId) {
    return <DumbPatientListingView onViewPatient={onViewPatient} />;
  }

  return <SurveyFlow patient={patient} />;
});

export const ReferralsView = connect(
  state => ({
    patientId: state.patient.id,
    patient: state.patient,
  }),
  dispatch => ({
    onViewPatient: id => dispatch(reloadPatient(id)),
  }),
)(DumbPatientLinker);
