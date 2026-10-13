import React, { useMemo, useState } from 'react';
import { useFormikContext } from 'formik';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router';

import { useSubmitSurveyResponse } from '@api/mutations';
import { useSurveyQuery } from '@api/queries/useSurveyQuery';
import { useTimeZoneQuery } from '@api/queries/useTimeZoneQuery';
import { BackLink, Loading, Muted, PageColumn, Panel } from '@components/layout';
import { DiscardChangesDialog } from '@components/DiscardChangesDialog';
import { useUnsavedChangesGuard } from '@components/useUnsavedChangesGuard';
import { useCurrentUser } from '@routes/PrivateRoute';
import {
  AuthContext,
  createPatientFormQuestionTypes,
  DateTimeProvider,
  getAnswersFromData,
  getVisibleAnswers,
  PatientSurveyForm,
  toPatientForm,
  TranslatedText,
  useDateTime,
  useSettings,
} from '@tamanu/ui-components';
import type { SurveyWithComponents } from '@tamanu/shared/schemas/patientPortal';
import { SettingsProvider } from '../contexts';
import { SurveyQuestionAutocompleteField } from '../features/survey/SurveyQuestionAutocompleteField';

/** The portal supports the shared patient form questions, searching with its own field. */
const { isSupportedQuestionType, getComponentForQuestionType } = createPatientFormQuestionTypes({
  AutocompleteQuestion: SurveyQuestionAutocompleteField,
});

/** The form fills the screen below the header, so Back and Next stay in view. */
const FormFrame = styled.div`
  height: calc(100dvh - 57px);
  max-width: 640px;
  margin: 0 auto;
  padding: 8px 12px 12px;
  display: flex;
  flex-direction: column;

  > main {
    flex: 1;
  }

  /* On a phone the form is the page, rather than a box within it */
  @media (max-width: 600px) {
    padding: 0;

    > main {
      border: none;
      border-radius: 0;
    }
  }
`;

const FormLoadError = () => (
  <PageColumn>
    <BackLink to="/">
      <TranslatedText stringId="patientPortal.home" fallback="Home" />
    </BackLink>
    <Panel>
      <Muted role="alert">
        <TranslatedText
          stringId="patientPortal.form.loadError"
          fallback="This form couldn't be opened. Please try again later."
        />
      </Muted>
    </Panel>
  </PageColumn>
);

/** Dates and times are entered in the facility's time, and stored as staff's are. */
const FormDateTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { data, isPending, isError } = useTimeZoneQuery();
  const { getSetting } = useSettings();
  if (isPending) return <Loading />;
  if (isError || !data?.primaryTimeZone) return <FormLoadError />;
  return (
    <DateTimeProvider
      primaryTimeZone={data.primaryTimeZone}
      facilityTimeZone={getSetting('facilityTimeZone')}
      dateTimeLocale={getSetting('dateTimeLocale')}
    >
      {children}
    </DateTimeProvider>
  );
};

/** Asks before answers the patient has entered are dropped by leaving the form unsubmitted. */
const UnsavedAnswersPrompt = ({ isSubmitting }: { isSubmitting: boolean }) => {
  const { dirty } = useFormikContext();
  const { blocker } = useUnsavedChangesGuard(dirty && !isSubmitting);
  if (blocker.state !== 'blocked') return null;
  return <DiscardChangesDialog onKeepEditing={blocker.reset} onDiscard={blocker.proceed} />;
};

/** The form itself, timed in the primary time zone like a response staff record. */
const SurveyFormPage = ({ survey }: { survey: SurveyWithComponents }) => {
  const { getCurrentDateTime } = useDateTime();
  const [startTime] = useState(getCurrentDateTime);
  const { mutate: submitSurveyResponse, isPending: isSubmitting } = useSubmitSurveyResponse();
  const { additionalData, ...patient } = useCurrentUser();
  const navigate = useNavigate();
  const form = useMemo(() => toPatientForm(survey, isSupportedQuestionType), [survey]);

  const handleComplete = async (values: Record<string, unknown>) => {
    submitSurveyResponse({
      surveyId: survey.id,
      startTime,
      patientId: patient.id,
      endTime: getCurrentDateTime(),
      answers: (await getAnswersFromData(getVisibleAnswers(form, values), survey)) as Record<
        string,
        unknown
      >,
    });
  };

  return (
    <FormFrame>
      <PatientSurveyForm
        form={form}
        patient={patient}
        patientAdditionalData={additionalData}
        getComponentForQuestionType={getComponentForQuestionType}
        onComplete={handleComplete}
        onExit={() => navigate('/')}
        finishLabel={<TranslatedText stringId="general.action.submit" fallback="Submit" />}
        isFinishing={isSubmitting}
      >
        <UnsavedAnswersPrompt isSubmitting={isSubmitting} />
      </PatientSurveyForm>
    </FormFrame>
  );
};

export const SurveyView = () => {
  const { surveyId } = useParams() as { surveyId: string };
  const { isPending, data: survey } = useSurveyQuery(surveyId);

  if (isPending) return <Loading />;
  if (!survey?.portalSurveyAssignment) return <FormLoadError />;

  /**
   * The facilityId is captured from the facility where the survey was assigned. Provided to
   * the survey in the portal for suggesters to filter data correctly.
   */
  const { facilityId } = survey.portalSurveyAssignment;

  return (
    <AuthContext.Provider value={{ facilityId }}>
      <SettingsProvider facilityId={facilityId}>
        <FormDateTimeProvider>
          <SurveyFormPage survey={survey} />
        </FormDateTimeProvider>
      </SettingsProvider>
    </AuthContext.Provider>
  );
};
