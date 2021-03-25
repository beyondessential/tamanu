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

const DumbReferralFlow = React.memo(
  ({ onFetchReferral, onSubmitReferral, fetchReferralForms, patient }) => {
    const [referral, setReferral] = useState(null);
    const [referralForms, setReferralForms] = useState(null);
    const [startTime, setStartTime] = useState(null);

    useEffect(() => {
      (async () => {
        const response = await fetchReferralForms();

        setReferralForms(response.referrals.map(x => ({ value: x.id, label: x.name })));
      })()
    }, []);

    const onSelectSurvey = useCallback(async id => {
      const response = await onFetchReferral(encodeURIComponent(id));
      setReferral(response);
      setStartTime(new Date());
    });

    const onCancelSurvey = useCallback(() => {
      setReferral(null);
    });

    const onSubmit = useCallback(
      data => {
        onSubmitReferral({
          surveyId: referral.id,
          startTime: startTime,
          patientId: patient.id,
          endTime: new Date(),
          answers: data,
        });
      },
      [startTime, referral],
    );

    if (!referral) {
      return (
        <>
          <PatientDisplay />
          <ProgramsPane>
            <ProgramsPaneHeader>
              <ProgramsPaneHeading variant="h6">Select a referral</ProgramsPaneHeading>
            </ProgramsPaneHeader>
            <FormGrid columns={1}>
              <SurveySelector
                onSelectSurvey={onSelectSurvey}
                surveys={referralForms}
                buttonText="Begin Referral"
              />
            </FormGrid>
          </ProgramsPane>
        </>
      );
    }

    return <SurveyView onSubmit={onSubmit} survey={referral} onCancel={onCancelSurvey} />;
  },
);

const ReferralFlow = connectApi(api => ({
  onFetchReferral: id => api.get(`survey/${id}`),
  onSubmitReferral: async data => {
    const response = await api.post(`surveyResponse`, data);

    return api.post('referral', {
      initiatingEncounterId: response.encounterId,
      surveyResponseId: response.id,
    });
  },
  fetchReferralForms: () => api.get(`survey`, { type: SURVEY_TYPES.REFERRAL }),
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
