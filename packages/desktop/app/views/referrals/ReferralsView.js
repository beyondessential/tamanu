import React, { useState, useCallback, useEffect } from 'react';
import { connect } from 'react-redux';

import { connectApi } from 'desktop/app/api';
import { reloadPatient } from 'desktop/app/store/patient';
import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { DumbPatientListingView } from 'desktop/app/views/patients/PatientListingView';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { SURVEY_TYPES } from 'shared/constants';




import { SurveySelector } from '../programs/SurveySelector';
import { PatientDisplay } from '../programs/PatientDisplay';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from '../programs/ProgramsPane';
import { getCurrentUser } from '../../store';

const DumbReferralFlow = React.memo(
  ({ onFetchReferralSurvey, onSubmitReferral, fetchReferralSurveys, patient, currentUser }) => {
    const [referralSurvey, setReferralSurvey] = useState(null);
    const [referralSurveys, setReferralSurveys] = useState(null);
    const [startTime, setStartTime] = useState(null);

    useEffect(() => {
      (async () => {
        const response = await fetchReferralSurveys();

        setReferralSurveys(response.surveys.map(x => ({ value: x.id, label: x.name })));
      })()
    }, []);

    const onSelectReferralSurvey = useCallback(async id => {
      const response = await onFetchReferralSurvey(encodeURIComponent(id));
      setReferralSurvey(response);
      setStartTime(new Date());
    });

    const onCancelReferral = useCallback(() => {
      setReferralSurvey(null);
    });

    const onSubmit = useCallback(
      data => {
        onSubmitReferral({
          surveyId: referralSurvey.id,
          startTime: startTime,
          patientId: patient.id,
          endTime: new Date(),
          answers: data,
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
                buttonText="Begin Referral"
              />
            </FormGrid>
          </ProgramsPane>
        </>
      );
    }

    return <SurveyView onSubmit={onSubmit} survey={referralSurvey} onCancel={onCancelReferral} patient={patient} currentUser={currentUser} />;
  },
);

const ReferralFlow = connectApi(api => ({
  onFetchReferralSurvey: id => api.get(`survey/${id}`),
  onSubmitReferral: async data => api.post('referral', data),
  fetchReferralSurveys: () => api.get(`survey`, { type: SURVEY_TYPES.REFERRAL }),
}))(DumbReferralFlow);

const DumbPatientLinker = React.memo(({ patient, patientId, onViewPatient, currentUser }) => {
  if (!patientId) {
    return <DumbPatientListingView onViewPatient={onViewPatient} />;
  }

  return <ReferralFlow patient={patient} currentUser={currentUser} />;
});

export const ReferralsView = connect(
  state => ({
    patientId: state.patient.id,
    patient: state.patient,
    currentUser: getCurrentUser(state),
  }),
  dispatch => ({
    onViewPatient: id => dispatch(reloadPatient(id)),
  }),
)(DumbPatientLinker);
