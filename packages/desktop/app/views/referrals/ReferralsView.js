import React, { useEffect, useCallback } from 'react';

import { connect } from 'react-redux';
import { connectApi } from 'desktop/app/api';

import { reloadPatient } from 'desktop/app/store/patient';

import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { DumbPatientListingView } from 'desktop/app/views/patients/PatientListingView';
import { SurveySelector } from '../programs/SurveySelector';

const DumbReferralFlow = React.memo(
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

const ReferralFlow = connectApi(api => ({
  onFetchSurvey: id => api.get(`survey/${id}`),
  onFetchSurveysList: () => api.get(`survey/referrals`),
  onSubmitSurvey: async data => {
    const response = await api.post(`surveyResponse`, data);
    return api.post('referral', {
      initiatingEncounter: response.encounterId,
      surveyResponseId: response.id,
    });
  },
}))(DumbReferralFlow);

const DumbPatientLinker = React.memo(({ patient, patientId, onViewPatient }) => {
  if (!patientId) {
    return <DumbPatientListingView onViewPatient={onViewPatient} />;
  }

  return <ReferralFlow patient={patient} />;
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
