import React from 'react';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import FormHelperText from '@mui/material/FormHelperText';
import { getIn, useFormikContext } from 'formik';

import { SUBMIT_ATTEMPTED_STATUS } from '@tamanu/constants';
import { RequiredOrnament } from '@tamanu/ui-components';
import { usePatientAdditionalDataQuery } from '../api/queries';
import { useDischargeSyndromicSurveillanceSurveyQuery } from '../api/queries/useDischargeSyndromicSurveillanceSurveyQuery';
import { EmbeddedSurveyBox } from '../components/EmbeddedSurveyBox';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { SyndromicSurveillanceComplete } from '../components/SyndromicSurveillanceComplete';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { usePatient } from '../contexts/Patient';
import { useSubmitSyndromicSurveillance } from '../hooks/useSubmitSyndromicSurveillance';
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

// A long form scrolls within its box, rather than growing the discharge modal to fit it.
const ScrollableSurveyBox = styled(EmbeddedSurveyBox)`
  max-height: 400px;
  overflow-y: auto;
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
  const { patient } = usePatient();
  const { currentUser } = useAuth();
  const { errors, status } = useFormikContext();
  const submitSyndromicSurveillance = useSubmitSyndromicSurveillance({
    encounterId,
    patientId: patient.id,
    isDischarging: true,
  });
  // Without the status, whether the encounter already has a response is unknown, so the form is not
  // offered for a submission that may well be refused.
  const { data: survey, isError: isSurveyLoadFailed } =
    useDischargeSyndromicSurveillanceSurveyQuery(encounterId, { enabled: !hasStatusLoadFailed });
  const { data: patientAdditionalData, isLoading: isLoadingPatientAdditionalData } =
    usePatientAdditionalDataQuery(patient.id);

  // Shown, like the discharge form's other errors, only once finalising it has been attempted.
  const requiredError =
    status?.submitStatus === SUBMIT_ATTEMPTED_STATUS
      ? getIn(errors, SYNDROMIC_SURVEILLANCE_VALIDATION_KEY)
      : null;
  const hasRequiredError = Boolean(requiredError);

  // spec: SYND#discharge-form
  // Recorded as soon as it is submitted, separately from finalising the discharge, the same way a
  // form submitted from within a procedure is.
  const submitSurveyResponse = async formValues => {
    await submitSyndromicSurveillance(survey, formValues);
    setHasUnsubmittedAnswers(false);
  };

  return (
    <>
      <ScrollableSurveyBox
        style={hasRequiredError ? { borderColor: Colors.alert } : undefined}
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
            showButtonRowDivider={false}
            setSurveyFormDirty={setHasUnsubmittedAnswers}
          />
        </EmbeddedSurveyContent>
      </ScrollableSurveyBox>
      {hasRequiredError && (
        <FormHelperText error data-testid="formhelpertext-syndromic-surveillance-required">
          {requiredError}
        </FormHelperText>
      )}
    </>
  );
};

/**
 * The discharge form's syndromic surveillance section: the syndromic surveillance form to complete
 * until the encounter has a response to it, then that it is complete.
 *
 * spec: SYND#discharge-form
 */
export const DischargeSyndromicSurveillanceSection = ({
  encounterId,
  isRequired,
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
        {isRequired && <RequiredOrnament data-testid="requiredornament-syndromic-surveillance" />}
      </SectionTitle>
      <IntroText data-testid="introtext-syndromic-surveillance-section">
        <TranslatedText
          stringId="discharge.syndromicSurveillance.intro"
          fallback="Please complete the below for syndromic surveillance"
          data-testid="translatedtext-syndromic-surveillance-section-intro"
        />
      </IntroText>
      {isComplete ? (
        <EmbeddedSurveyBox data-testid="embeddedsurveybox-syndromic-surveillance-complete">
          <SyndromicSurveillanceComplete data-testid="syndromicsurveillancecomplete-discharge" />
        </EmbeddedSurveyBox>
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
