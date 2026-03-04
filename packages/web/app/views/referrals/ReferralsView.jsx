import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { SURVEY_TYPES } from '@tamanu/constants';
import { getAnswersFromData, FormGrid } from '@tamanu/ui-components';

import { useApi } from '../../api';
import { reloadPatient } from '../../store/patient';
import { SurveyView } from '../programs/SurveyView';
import { PatientListingView } from '..';
import { usePatientAdditionalDataQuery } from '../../api/queries';
import { ErrorMessage } from '../../components/ErrorMessage';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { SurveySelector } from '../programs/SurveySelector';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from '../programs/ProgramsPane';
import { getCurrentUser } from '../../store';
import { PATIENT_TABS } from '../../constants/patientPaths';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { useAuth } from '../../contexts/Auth';
import { TranslatedText } from '../../components';

const ReferralFlow = ({ patient, currentUser }) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const { navigateToPatient } = usePatientNavigation();
  const [referralSurvey, setReferralSurvey] = useState(null);
  const [referralSurveys, setReferralSurveys] = useState(null);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
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

  const submitReferral = async data => {
    await api.post('referral', {
      surveyId: referralSurvey.id,
      startTime,
      patientId: patient.id,
      endTime: getCurrentDateTimeString(),
      answers: await getAnswersFromData(data, referralSurvey),
      facilityId,
    });

    navigateToPatient(patient.id, { tab: PATIENT_TABS.REFERRALS });
  };

  const { isLoading, data: patientAdditionalData, isError, error } = usePatientAdditionalDataQuery(
    patient.id,
  );

  if (isLoading) {
    return <LoadingIndicator data-testid="loadingindicator-uqkf" />;
  }

  if (isError) {
    return <ErrorMessage title="Error" error={error} data-testid="errormessage-ub43" />;
  }

  if (!referralSurvey) {
    return (
      <ProgramsPane data-testid="programspane-6xjz">
        <ProgramsPaneHeader data-testid="programspaneheader-8cj1">
          <ProgramsPaneHeading variant="h6" data-testid="programspaneheading-a55s">
            <TranslatedText
              stringId="referral.selectReferral.label"
              fallback="Select a referral"
              data-testid="translatedtext-referral-select-referral-text"
            />
          </ProgramsPaneHeading>
        </ProgramsPaneHeader>
        <FormGrid columns={1} data-testid="formgrid-prtu">
          <SurveySelector
            onSubmit={setSelectedReferral}
            onChange={setSelectedSurveyId}
            value={selectedSurveyId}
            surveys={referralSurveys}
            buttonText={
              <TranslatedText
                stringId="referral.action.begin"
                fallback="Begin referral"
                data-testid="translatedtext-referral-action-begin"
              />
            }
            data-testid="surveyselector-6c7l"
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
      patientAdditionalData={patientAdditionalData}
      currentUser={currentUser}
      data-testid="surveyview-3mvd"
    />
  );
};

export const ReferralsView = () => {
  const patient = useSelector(state => state.patient);
  const currentUser = useSelector(getCurrentUser);
  const dispatch = useDispatch();
  if (!patient.id) {
    return (
      <PatientListingView
        onViewPatient={id => {
          dispatch(reloadPatient(id));
        }}
        data-testid="patientlistingview-o7jr"
      />
    );
  }

  return (
    <ReferralFlow patient={patient} currentUser={currentUser} data-testid="referralflow-ctqh" />
  );
};
