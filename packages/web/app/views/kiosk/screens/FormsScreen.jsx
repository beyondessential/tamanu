import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import {
  getAnswersFromData,
  getVisibleAnswers,
  TranslatedReferenceData,
  useDateTime,
} from '@tamanu/ui-components';

import { TranslatedText } from '../../../components';
import { useTranslation } from '../../../contexts/Translation';
import { AppointmentSummary } from '../AppointmentSummary';
import {
  useKioskAppointmentQuery,
  useKioskCheckInMutation,
  useKioskSubmitFormMutation,
} from '../kioskApi';
import { CheckIcon } from '../KioskIcons';
import { FormNotSavedDialog } from '../KioskModals';
import { FORM_STATUSES, useKioskSession } from '../KioskSession';
import {
  ErrorMessage,
  Lead,
  Panel,
  PrimaryButton,
  scaled,
  StateIcon,
  whenCompact,
  Title,
} from '../kioskStyles';
import { toKioskForm } from '../forms/kioskQuestions';
import { KioskSurveyForm } from '../forms/KioskSurveyForm';

const Split = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(${scaled(240)}, ${scaled(290)}) 1fr;
  gap: ${scaled(20)};
  margin: 0 ${scaled(28)} ${scaled(28)};

  > ${Panel} {
    margin: 0;
  }

  ${whenCompact`
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    gap: ${scaled(12)};
    margin: 0 ${scaled(16)} ${scaled(16)};
  `}
`;

const FormsNav = styled.nav`
  display: flex;
  flex-direction: column;
  padding: ${scaled(24)} ${scaled(16)};
  overflow-y: auto;
  background: var(--kiosk-surface);
  border: var(--kiosk-border) solid var(--kiosk-outline);
  border-radius: 16px;

  ${whenCompact`
    flex-direction: row;
    align-items: center;
    gap: ${scaled(8)};
    padding: ${scaled(8)};
    overflow: auto hidden;
  `}
`;

const NavSummary = styled.div`
  ${whenCompact`
    flex: none;
    padding-right: ${scaled(8)};
  `}
`;

const NavHeading = styled.h2`
  margin: 0 ${scaled(12)} ${scaled(4)};
  font-size: ${scaled(20)};
  font-weight: 500;
  color: var(--kiosk-heading);
`;

const NavCount = styled.div`
  margin: 0 ${scaled(12)} ${scaled(18)};
  font-size: ${scaled(15)};
  color: var(--kiosk-text-secondary);

  ${whenCompact`
    margin-bottom: 0;
  `}
`;

const FormSteps = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;

  ${whenCompact`
    display: flex;
    align-items: center;
    gap: ${scaled(8)};
  `}
`;

const FormStep = styled.li`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: ${scaled(14)};
  min-height: ${scaled(80)};
  padding: 0 ${scaled(12)};

  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: calc(${scaled(12)} + ${scaled(16)} - 1px);
    top: calc(${scaled(32)} + ${scaled(6)});
    bottom: ${scaled(6)};
    width: 2px;
    border-radius: 1px;
    background: var(--kiosk-outline);
  }

  &[data-status='completed']::before {
    background: var(--kiosk-success);
  }

  ${whenCompact`
    flex: none;
    align-items: center;
    min-height: 0;
    padding: ${scaled(6)} ${scaled(10)};

    &:not(:last-child)::before {
      display: none;
    }
  `}
`;

const StepMark = styled.span`
  width: ${scaled(32)};
  height: ${scaled(32)};
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--kiosk-surface);
  box-shadow: inset 0 0 0 2px var(--kiosk-outline);
  font-size: ${scaled(15)};
  font-weight: 500;
  color: var(--kiosk-text-tertiary);

  svg {
    width: 62%;
    height: 62%;
  }

  [data-status='completed'] > & {
    background: var(--kiosk-success-tint);
    box-shadow: none;
    color: var(--kiosk-success);
  }

  [aria-current='step'] > & {
    background: var(--kiosk-primary);
    box-shadow: none;
    color: var(--kiosk-on-primary);
  }
`;

const StepName = styled.div`
  padding-top: ${scaled(5)};
  font-size: ${scaled(18)};
  font-weight: 500;
  line-height: 1.25;
  color: var(--kiosk-text-secondary);

  [data-status='completed'] & {
    color: var(--kiosk-text);
  }

  [aria-current='step'] & {
    color: var(--kiosk-heading);
  }

  ${whenCompact`
    padding-top: 0;
  `}
`;

const StepStatus = styled.div`
  margin-top: ${scaled(2)};
  font-size: ${scaled(14)};
  color: var(--kiosk-success);

  [aria-current='step'] & {
    color: var(--kiosk-primary);
  }
`;

const ReadyToCheckIn = ({ appointment, onCheckIn, isCheckingIn, isError, hasForms }) => (
  <Panel $centred>
    <StateIcon $tone="success">
      <CheckIcon />
    </StateIcon>
    <Title>
      <TranslatedText stringId="kiosk.ready.title" fallback="You're ready to check in" />
    </Title>
    <Lead>
      {hasForms ? (
        <TranslatedText stringId="kiosk.ready.text" fallback="All your forms are complete." />
      ) : (
        <TranslatedText
          stringId="kiosk.ready.noForms"
          fallback="There are no forms to fill in today."
        />
      )}
    </Lead>
    <AppointmentSummary appointment={appointment} />
    <PrimaryButton $wide onClick={onCheckIn} disabled={isCheckingIn} data-testid="kiosk-check-in">
      {isCheckingIn ? (
        <TranslatedText stringId="kiosk.ready.checkingIn" fallback="Checking in…" />
      ) : (
        <TranslatedText stringId="kiosk.ready.checkIn" fallback="Check in" />
      )}
    </PrimaryButton>
    {isError && (
      <ErrorMessage role="alert" style={{ marginTop: scaled(20), fontSize: scaled(18) }}>
        <TranslatedText
          stringId="kiosk.ready.error"
          fallback="We couldn't check you in. Please go to reception."
        />
      </ErrorMessage>
    )}
  </Panel>
);

const LoadingForms = ({ isError }) => (
  <Panel $centred>
    <Title>
      {isError ? (
        <TranslatedText
          stringId="kiosk.forms.loadError"
          fallback="Something went wrong. Please go to reception."
        />
      ) : (
        <TranslatedText stringId="kiosk.forms.loading" fallback="Getting your forms ready…" />
      )}
    </Title>
  </Panel>
);

export const FormsScreen = () => {
  const { session, dispatch } = useKioskSession();
  const { getTranslation } = useTranslation();
  const { getCurrentDateTime } = useDateTime();
  const { data, isLoading, isError } = useKioskAppointmentQuery(session.appointment.id);
  const submitForm = useKioskSubmitFormMutation(session.appointment.id);
  const checkIn = useKioskCheckInMutation(session.appointment.id);
  const { formProgress, openFormId } = session;

  const forms = useMemo(() => data?.forms.map(toKioskForm) ?? [], [data]);
  // A form submitted before the patient started over is complete, with no answers on the tablet
  const progressOf = formId => {
    const progress = formProgress[formId] ?? {};
    const isSubmitted =
      data?.submittedSurveyIds.includes(formId) || progress.status === FORM_STATUSES.COMPLETED;
    return {
      ...progress,
      status: isSubmitted
        ? FORM_STATUSES.COMPLETED
        : (progress.status ?? FORM_STATUSES.NOT_STARTED),
    };
  };
  const isCompleted = formId => progressOf(formId).status === FORM_STATUSES.COMPLETED;
  const completedCount = forms.filter(({ id }) => isCompleted(id)).length;
  const currentForm = forms.find(({ id }) => !isCompleted(id)) ?? null;
  const reviewedForm =
    forms.find(({ id }) => id === openFormId && isCompleted(id) && progressOf(id).values) ?? null;

  const [shownSince, setShownSince] = useState({ formId: undefined, startTime: null });
  if (currentForm?.id !== shownSince.formId) {
    setShownSince({ formId: currentForm?.id, startTime: getCurrentDateTime() });
  }

  const saveProgress = useCallback(
    (formId, progress, startTime = getCurrentDateTime()) =>
      dispatch({ type: 'saveFormProgress', formId, progress, startTime }),
    [dispatch, getCurrentDateTime],
  );
  const saveCurrentFormProgress = useCallback(
    progress => saveProgress(shownSince.formId, progress, shownSince.startTime),
    [saveProgress, shownSince],
  );

  const completeForm = (form, values) => {
    const endTime = getCurrentDateTime();
    submitForm.mutate(
      {
        surveyId: form.id,
        buildResponse: async () => ({
          answers: await getAnswersFromData(getVisibleAnswers(form, values), form.survey),
          // How long the patient spent on this form
          startTime: shownSince.startTime,
          endTime,
        }),
      },
      {
        onSuccess: () =>
          saveProgress(
            form.id,
            { status: FORM_STATUSES.COMPLETED, values, endTime },
            shownSince.startTime,
          ),
      },
    );
  };

  const goBackFrom = formId => {
    const index = forms.findIndex(({ id }) => id === formId);
    const previousForm = forms
      .slice(0, index)
      .reverse()
      .find(({ id }) => progressOf(id).values);
    if (previousForm) {
      dispatch({ type: 'openForm', formId: previousForm.id });
    } else {
      dispatch({ type: 'backToMatches' });
    }
  };

  const handleCheckIn = () =>
    checkIn.mutate(undefined, { onSuccess: () => dispatch({ type: 'checkedIn' }) });

  if (isLoading || isError) return <LoadingForms isError={isError} />;

  const readyPanel = (
    <ReadyToCheckIn
      appointment={data.appointment}
      onCheckIn={handleCheckIn}
      isCheckingIn={checkIn.isLoading}
      isError={checkIn.isError}
      hasForms={forms.length > 0}
    />
  );
  if (forms.length === 0) return readyPanel;

  const renderOpenForm = () => {
    if (reviewedForm) {
      return (
        <KioskSurveyForm
          key={`review-${reviewedForm.id}`}
          form={reviewedForm}
          patient={data.patient}
          patientAdditionalData={data.patientAdditionalData}
          progress={progressOf(reviewedForm.id)}
          readOnlyNotice={
            <TranslatedText
              stringId="kiosk.forms.submitted"
              fallback="This form has been submitted and can't be changed."
            />
          }
          onComplete={() => dispatch({ type: 'openForm', formId: null })}
          onExit={() => goBackFrom(reviewedForm.id)}
        />
      );
    }
    if (currentForm) {
      return (
        <KioskSurveyForm
          key={currentForm.id}
          form={currentForm}
          patient={data.patient}
          patientAdditionalData={data.patientAdditionalData}
          progress={progressOf(currentForm.id)}
          onSaveProgress={saveCurrentFormProgress}
          onComplete={values => completeForm(currentForm, values)}
          onExit={() => goBackFrom(currentForm.id)}
          isFinishing={submitForm.isLoading}
        />
      );
    }
    return readyPanel;
  };

  return (
    <Split>
      <FormsNav aria-label={getTranslation('kiosk.forms.title', 'Your forms')}>
        <NavSummary>
          <NavHeading>
            <TranslatedText stringId="kiosk.forms.title" fallback="Your forms" />
          </NavHeading>
          <NavCount>
            <TranslatedText
              stringId="kiosk.forms.completeCount"
              fallback=":completed of :total complete"
              replacements={{ completed: completedCount, total: forms.length }}
            />
          </NavCount>
        </NavSummary>
        <FormSteps>
          {forms.map((form, index) => {
            const isCurrent = form.id === currentForm?.id;
            const isFormCompleted = isCompleted(form.id);
            return (
              <FormStep
                key={form.id}
                data-status={isFormCompleted ? FORM_STATUSES.COMPLETED : undefined}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <StepMark>{isFormCompleted ? <CheckIcon /> : index + 1}</StepMark>
                <div>
                  <StepName>
                    <TranslatedReferenceData
                      category="survey"
                      value={form.id}
                      fallback={form.name}
                    />
                  </StepName>
                  {isFormCompleted && (
                    <StepStatus>
                      <TranslatedText
                        stringId="kiosk.forms.status.completed"
                        fallback="Completed"
                      />
                    </StepStatus>
                  )}
                  {isCurrent && (
                    <StepStatus>
                      <TranslatedText
                        stringId="patientForm.pageCount"
                        fallback="Page :page of :pageCount"
                        replacements={{
                          page: (progressOf(form.id).pageIndex ?? 0) + 1,
                          pageCount: form.pages.length,
                        }}
                      />
                    </StepStatus>
                  )}
                </div>
              </FormStep>
            );
          })}
        </FormSteps>
      </FormsNav>
      {renderOpenForm()}
      {submitForm.isError && <FormNotSavedDialog onClose={() => submitForm.reset()} />}
    </Split>
  );
};
