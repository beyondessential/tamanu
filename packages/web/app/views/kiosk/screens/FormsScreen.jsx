import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

import {
  getAnswersFromData,
  getVisibleAnswers,
  TranslatedReferenceData,
  useDateTime,
} from '@tamanu/ui-components';

import { TranslatedText } from '../../../components';
import { useTranslation } from '../../../contexts/Translation';
import { useKioskAppointmentQuery, useKioskCheckInMutation } from '../kioskApi';
import { CheckIcon } from '../KioskIcons';
import { FORM_STATUSES, useKioskSession } from '../KioskSession';
import {
  ErrorMessage,
  Lead,
  Panel,
  PrimaryButton,
  scaled,
  StateIcon,
  whenCompact,
  SummaryList,
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

  /* The forms list becomes a strip above the open form */
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

const FormItem = styled.button.attrs({ type: 'button' })`
  display: flex;
  align-items: center;
  gap: ${scaled(14)};
  width: 100%;
  padding: ${scaled(14)} ${scaled(12)};
  border: none;
  border-radius: 12px;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;

  & + & {
    margin-top: ${scaled(4)};
  }

  &[aria-current='true'] {
    background: var(--kiosk-primary-tint);
    box-shadow: inset 0 0 0 2px var(--kiosk-primary);
  }

  ${whenCompact`
    flex: none;
    width: auto;
    padding: ${scaled(10)} ${scaled(14)};

    & + & {
      margin-top: 0;
    }
  `}
`;

const StatusMark = styled.span`
  width: ${scaled(32)};
  height: ${scaled(32)};
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: inset 0 0 0 2px var(--kiosk-outline);

  svg {
    width: 62%;
    height: 62%;
  }

  &[data-status='completed'] {
    background: var(--kiosk-success-tint);
    box-shadow: inset 0 0 0 var(--kiosk-border) var(--kiosk-success-tint);
    color: var(--kiosk-success);
  }

  [aria-current='true'] > &[data-status]:not([data-status='completed']) {
    background: var(--kiosk-surface);
    box-shadow: inset 0 0 0 2px var(--kiosk-primary);

    &::after {
      content: '';
      width: ${scaled(12)};
      height: ${scaled(12)};
      border-radius: 50%;
      background: var(--kiosk-primary);
    }
  }
`;

const FormName = styled.div`
  font-size: ${scaled(18)};
  font-weight: 500;
  line-height: 1.25;

  [aria-current='true'] & {
    color: var(--kiosk-heading);
  }
`;

const FormStatus = styled.div`
  margin-top: ${scaled(2)};
  font-size: ${scaled(14)};
  color: var(--kiosk-text-tertiary);

  &[data-status='completed'] {
    color: var(--kiosk-success);
  }

  [aria-current='true'] &:not([data-status='completed']) {
    color: var(--kiosk-primary);
  }
`;

const FormStatusText = ({ status, pageIndex, pageCount }) => {
  if (status === FORM_STATUSES.COMPLETED) {
    return <TranslatedText stringId="kiosk.forms.status.completed" fallback="Completed" />;
  }
  if (status === FORM_STATUSES.IN_PROGRESS && pageCount > 1) {
    return (
      <TranslatedText
        stringId="kiosk.forms.status.inProgressPage"
        fallback="In progress, page :page of :pageCount"
        replacements={{ page: pageIndex + 1, pageCount }}
      />
    );
  }
  if (status === FORM_STATUSES.IN_PROGRESS) {
    return <TranslatedText stringId="kiosk.forms.status.inProgress" fallback="In progress" />;
  }
  return <TranslatedText stringId="kiosk.forms.status.notStarted" fallback="Not started" />;
};

const ReadyToCheckIn = ({ appointment, onCheckIn, isCheckingIn, isError, hasForms }) => {
  const { formatTime } = useDateTime();
  return (
    <Panel $centred>
      <StateIcon $tone="success">
        <CheckIcon />
      </StateIcon>
      <Title>
        <TranslatedText stringId="kiosk.ready.title" fallback="You're ready to check in" />
      </Title>
      {hasForms && (
        <Lead>
          <TranslatedText stringId="kiosk.ready.text" fallback="All your forms are complete." />
        </Lead>
      )}
      <SummaryList
        style={{
          display: 'inline-grid',
          gridTemplateColumns: 'auto auto',
          marginTop: hasForms ? 0 : scaled(20),
        }}
      >
        <div>
          <dt>
            <TranslatedText stringId="kiosk.ready.appointment" fallback="Appointment" />
          </dt>
          <dd>
            <TranslatedText
              stringId="kiosk.ready.appointmentTime"
              fallback="Today, :time"
              replacements={{ time: formatTime(appointment.startTime) }}
            />
          </dd>
        </div>
        {appointment.clinician && (
          <div>
            <dt>
              <TranslatedText
                stringId="general.localisedField.clinician.label"
                fallback="Clinician"
              />
            </dt>
            <dd>{appointment.clinician.displayName}</dd>
          </div>
        )}
      </SummaryList>
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
};

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
  const checkIn = useKioskCheckInMutation(session.appointment.id);
  const { formProgress, openFormId } = session;

  const forms = useMemo(() => data?.forms.map(toKioskForm) ?? [], [data]);
  const progressOf = formId => ({ status: FORM_STATUSES.NOT_STARTED, ...formProgress[formId] });
  const completedCount = forms.filter(
    ({ id }) => progressOf(id).status === FORM_STATUSES.COMPLETED,
  ).length;
  const firstUnfinished = forms.find(({ id }) => progressOf(id).status !== FORM_STATUSES.COMPLETED);
  const openForm =
    forms.find(({ id }) => id === openFormId) ?? (openFormId === null ? firstUnfinished : null);

  const saveProgress = useCallback(
    (formId, progress) =>
      dispatch({ type: 'saveFormProgress', formId, progress, startTime: getCurrentDateTime() }),
    [dispatch, getCurrentDateTime],
  );
  const saveOpenFormProgress = useCallback(
    progress => saveProgress(openForm?.id, progress),
    [saveProgress, openForm?.id],
  );

  /**
   * Opens a form. `isReopening` is for the patient choosing a form from the list, where a form
   * they had completed is reviewed from the start and must be finished again so any changed
   * answers are checked before they can check in. Back from the first page just returns to the
   * previous form, and leaves a completed one completed.
   */
  const openFormById = (formId, { isReopening = true } = {}) => {
    const { status } = progressOf(formId);
    if (status === FORM_STATUSES.NOT_STARTED) {
      saveProgress(formId, { status: FORM_STATUSES.IN_PROGRESS, pageIndex: 0 });
    } else if (isReopening && status === FORM_STATUSES.COMPLETED && formId !== openForm?.id) {
      saveProgress(formId, { status: FORM_STATUSES.IN_PROGRESS, pageIndex: 0 });
    }
    dispatch({ type: 'openForm', formId });
  };

  const completeForm = (formId, values) => {
    saveProgress(formId, {
      status: FORM_STATUSES.COMPLETED,
      values,
      endTime: getCurrentDateTime(),
    });
    const nextForm = forms.find(
      ({ id }) => id !== formId && progressOf(id).status !== FORM_STATUSES.COMPLETED,
    );
    if (nextForm) {
      openFormById(nextForm.id);
    } else {
      // An explicit "no form open" shows Ready to check in
      dispatch({ type: 'openForm', formId: false });
    }
  };

  const buildResponses = () =>
    Promise.all(
      forms.map(async form => {
        const { values, startTime, endTime } = progressOf(form.id);
        return {
          surveyId: form.id,
          answers: await getAnswersFromData(getVisibleAnswers(form, values ?? {}), form.survey),
          // How long the patient spent on this form, rather than the moment they checked in
          startTime,
          endTime,
        };
      }),
    );
  const handleCheckIn = () =>
    checkIn.mutate(buildResponses, { onSuccess: () => dispatch({ type: 'checkedIn' }) });

  if (isLoading || isError) return <LoadingForms isError={isError} />;

  const appointment = data.appointment;
  const isReady = completedCount === forms.length;
  const readyPanel = (
    <ReadyToCheckIn
      appointment={appointment}
      onCheckIn={handleCheckIn}
      isCheckingIn={checkIn.isLoading}
      isError={checkIn.isError}
      hasForms={forms.length > 0}
    />
  );
  if (forms.length === 0) return readyPanel;

  const activeForm = openForm ?? null;
  const exitForm = formId => {
    const index = forms.findIndex(({ id }) => id === formId);
    if (index > 0) {
      openFormById(forms[index - 1].id, { isReopening: false });
    } else {
      dispatch({ type: 'backToMatches' });
    }
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
        {forms.map(form => {
          const { pageIndex = 0, ...progress } = progressOf(form.id);
          // The open form is in progress from the moment it's shown
          const status =
            form.id === activeForm?.id && progress.status === FORM_STATUSES.NOT_STARTED
              ? FORM_STATUSES.IN_PROGRESS
              : progress.status;
          return (
            <FormItem
              key={form.id}
              aria-current={form.id === activeForm?.id}
              onClick={() => openFormById(form.id)}
            >
              <StatusMark data-status={status}>
                {status === FORM_STATUSES.COMPLETED && <CheckIcon />}
              </StatusMark>
              <div>
                <FormName>
                  <TranslatedReferenceData category="survey" value={form.id} fallback={form.name} />
                </FormName>
                <FormStatus data-status={status}>
                  <FormStatusText
                    status={status}
                    pageIndex={pageIndex}
                    pageCount={form.pages.length}
                  />
                </FormStatus>
              </div>
            </FormItem>
          );
        })}
      </FormsNav>
      {activeForm ? (
        <KioskSurveyForm
          key={activeForm.id}
          form={activeForm}
          patient={data.patient}
          patientAdditionalData={data.patientAdditionalData}
          progress={progressOf(activeForm.id)}
          onSaveProgress={saveOpenFormProgress}
          onComplete={values => completeForm(activeForm.id, values)}
          onExit={() => exitForm(activeForm.id)}
        />
      ) : (
        isReady && readyPanel
      )}
    </Split>
  );
};
