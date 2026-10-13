import React, { useState } from 'react';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
import { getIn, useFormikContext } from 'formik';

import { SUBMIT_ATTEMPTED_STATUS } from '@tamanu/constants';
import { getAnswersFromData, useDateTime } from '@tamanu/ui-components';
import { useApi } from '../api';
import { usePatientAdditionalDataQuery } from '../api/queries';
import { useDischargeSyndromicSurveillanceSurveyQuery } from '../api/queries/useDischargeSyndromicSurveillanceSurveyQuery';
import { ENCOUNTER_SYNDROMIC_SURVEILLANCE_QUERY_KEY } from '../api/queries/useEncounterSyndromicSurveillanceQuery';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { SyndromicSurveillanceComplete } from '../components/SyndromicSurveillanceComplete';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { usePatient } from '../contexts/Patient';
import { SurveyViewForm } from '../views/programs/SurveyView';

// The discharge form validates syndromic surveillance under this key when it is required.
export const SYNDROMIC_SURVEILLANCE_VALIDATION_KEY = 'syndromicSurveillance';

const SectionDivider = styled(Divider)`
  margin: 0 auto;
`;

const SectionTitle = styled.h4`
  font-size: 18px;
  font-weight: 500;
  margin-block: 0 8px;
`;

const IntroText = styled.p`
  font-size: 14px;
  margin-block: 0 20px;
  color: ${Colors.midText};
`;

// Matches a form embedded in the procedure modal.
const SurveyBox = styled.div`
  background: ${Colors.white};
  padding: 20px;
  border-radius: 3px;
  border: 1px solid ${props => (props.$error ? Colors.alert : Colors.outline)};
`;

const LoadFailedText = styled.p`
  font-size: 14px;
  margin: 0;
  color: ${Colors.midText};
`;

// A form that fails to load says so, rather than leaving a loading indicator in its place for
// good: the query does not retry, so nothing would ever replace it.
const EmbeddedSurveyContent = ({ hasLoadFailed, isLoading, children }) => {
  if (hasLoadFailed) {
    return (
      <LoadFailedText data-testid="loadfailedtext-syndromic-surveillance">
        <TranslatedText
          stringId="discharge.syndromicSurveillance.loadFailed"
          fallback="Syndromic surveillance could not be loaded. Reopen the form to try again."
          data-testid="translatedtext-syndromic-surveillance-load-failed"
        />
      </LoadFailedText>
    );
  }
  if (isLoading) {
    return <LoadingIndicator data-testid="loadingindicator-syndromic-surveillance-discharge" />;
  }
  return children;
};

// The embedded form is a form of its own inside the discharge form, and a submit event bubbles to
// every form around it. Pressing Enter in a screen with a single text input submits the embedded
// form natively, which would otherwise go on to submit the discharge too.
const stopSubmitReachingDischargeForm = event => event.stopPropagation();

const EmbeddedSyndromicSurveillanceForm = ({
  encounterId,
  hasStatusLoadFailed,
  setHasUnsubmittedAnswers,
}) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { patient } = usePatient();
  const { currentUser, facilityId } = useAuth();
  const { getCurrentDateTime } = useDateTime();
  const [startTime] = useState(getCurrentDateTime);
  const { errors, status } = useFormikContext();
  // Without the status, whether the encounter already has a response is unknown, so the form is not
  // offered for a submission that may well be refused.
  const { data: survey, isError: isSurveyLoadFailed } =
    useDischargeSyndromicSurveillanceSurveyQuery(encounterId, { enabled: !hasStatusLoadFailed });
  const { data: patientAdditionalData, isLoading: isLoadingPatientAdditionalData } =
    usePatientAdditionalDataQuery(patient.id);

  const hasRequiredError =
    status?.submitStatus === SUBMIT_ATTEMPTED_STATUS &&
    Boolean(getIn(errors, SYNDROMIC_SURVEILLANCE_VALIDATION_KEY));

  // spec: SYND#discharge-form
  // Recorded as soon as it is submitted, separately from finalising the discharge, the same way a
  // form submitted from within a procedure is.
  const submitSurveyResponse = async data => {
    try {
      await api.post(
        `encounter/${encodeURIComponent(encounterId)}/syndromicSurveillance/dischargeSurveyResponse`,
        {
          facilityId,
          startTime,
          endTime: getCurrentDateTime(),
          answers: await getAnswersFromData(data, survey),
        },
      );
      setHasUnsubmittedAnswers(false);
      queryClient.invalidateQueries(['patientDetails', patient.id]);
    } finally {
      // Refreshed on failure too: a submission is rejected once the encounter has a response, such
      // as one a colleague has just submitted, and the section then shows it as complete rather
      // than holding the discharge on a form that can no longer be submitted.
      await queryClient.invalidateQueries([
        ENCOUNTER_SYNDROMIC_SURVEILLANCE_QUERY_KEY,
        encounterId,
      ]);
    }
  };

  return (
    <>
      <IntroText data-testid="introtext-syndromic-surveillance-section">
        <TranslatedText
          stringId="discharge.syndromicSurveillance.intro"
          fallback="Please complete the below for syndromic surveillance"
          data-testid="translatedtext-syndromic-surveillance-section-intro"
        />
      </IntroText>
      <SurveyBox
        $error={hasRequiredError}
        onSubmit={stopSubmitReachingDischargeForm}
        data-testid="surveybox-syndromic-surveillance"
      >
        <EmbeddedSurveyContent
          hasLoadFailed={hasStatusLoadFailed || isSurveyLoadFailed}
          isLoading={!survey || isLoadingPatientAdditionalData}
        >
          <SurveyViewForm
            survey={survey}
            onSubmit={submitSurveyResponse}
            patient={patient}
            patientAdditionalData={patientAdditionalData}
            currentUser={currentUser}
            setSurveyFormDirty={setHasUnsubmittedAnswers}
          />
        </EmbeddedSurveyContent>
      </SurveyBox>
    </>
  );
};

/**
 * The discharge form's syndromic surveillance section: the syndromic surveillance form to complete
 * until the encounter has a response to it, then only that it is complete.
 *
 * spec: SYND#discharge-form
 */
export const DischargeSyndromicSurveillanceSection = ({
  encounterId,
  isComplete,
  hasStatusLoadFailed,
  setHasUnsubmittedAnswers,
}) => (
  <>
    <SectionDivider
      style={{ gridColumn: '1 / -1' }}
      data-testid="divider-syndromic-surveillance-section"
    />
    <div style={{ gridColumn: '1 / -1' }}>
      <SectionTitle data-testid="sectiontitle-syndromic-surveillance">
        <TranslatedText
          stringId="encounter.syndromicSurveillance.label"
          fallback="Syndromic surveillance"
          data-testid="translatedtext-syndromic-surveillance-section-title"
        />
      </SectionTitle>
      {isComplete ? (
        <SyndromicSurveillanceComplete data-testid="syndromicsurveillancecomplete-discharge" />
      ) : (
        <EmbeddedSyndromicSurveillanceForm
          encounterId={encounterId}
          hasStatusLoadFailed={hasStatusLoadFailed}
          setHasUnsubmittedAnswers={setHasUnsubmittedAnswers}
        />
      )}
    </div>
  </>
);
