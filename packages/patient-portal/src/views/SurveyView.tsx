import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router';

import { useSubmitSurveyResponse } from '@api/mutations';
import { useSurveyQuery } from '@api/queries/useSurveyQuery';
import { useTimeZoneQuery } from '@api/queries/useTimeZoneQuery';
import { BackLink, Loading, Muted, PageColumn, Panel } from '@components/layout';
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
  useSettings,
} from '@tamanu/ui-components';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
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

/** Dates and times are entered in the facility's time, and stored as staff's are. */
const FormDateTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { data, isPending } = useTimeZoneQuery();
  const { getSetting } = useSettings();
  if (isPending) return <Loading />;
  return (
    <DateTimeProvider
      primaryTimeZone={data?.primaryTimeZone}
      facilityTimeZone={getSetting('facilityTimeZone')}
      dateTimeLocale={getSetting('dateTimeLocale')}
    >
      {children}
    </DateTimeProvider>
  );
};

export const SurveyView = () => {
  const { surveyId } = useParams() as { surveyId: string };
  const [startTime] = useState<string>(getCurrentDateTimeString());
  const { isPending, data: survey } = useSurveyQuery(surveyId);
  const { mutate: submitSurveyResponse, isPending: isSubmitting } = useSubmitSurveyResponse();
  const { additionalData, ...patient } = useCurrentUser();
  const navigate = useNavigate();
  const form = useMemo(() => survey && toPatientForm(survey, isSupportedQuestionType), [survey]);

  if (isPending) return <Loading />;

  if (!survey?.portalSurveyAssignment || !form) {
    return (
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
  }

  const handleComplete = async (values: Record<string, unknown>) => {
    submitSurveyResponse({
      surveyId,
      startTime,
      patientId: patient.id,
      endTime: getCurrentDateTimeString(),
      answers: (await getAnswersFromData(getVisibleAnswers(form, values), survey)) as Record<
        string,
        unknown
      >,
    });
  };

  /**
   * The facilityId is captured from the facility where the survey was assigned. Provided to
   * the survey in the portal for suggesters to filter data correctly.
   */
  const { facilityId } = survey.portalSurveyAssignment;

  return (
    <AuthContext.Provider value={{ facilityId }}>
      <SettingsProvider facilityId={facilityId}>
        <FormDateTimeProvider>
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
            />
          </FormFrame>
        </FormDateTimeProvider>
      </SettingsProvider>
    </AuthContext.Provider>
  );
};
