import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { APPOINTMENT_STATUSES, PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { DateTimeProviderContext, SettingsContext } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../helpers';
import { FormsScreen } from '../../../app/views/kiosk/screens/FormsScreen';

const kiosk = vi.hoisted(() => ({
  session: null,
  now: null,
  submittedSurveyIds: [],
  submissions: [],
  isSubmitFailing: false,
}));

vi.mock('../../../app/views/kiosk/KioskSession', async importOriginal => {
  const actual = await importOriginal();
  const { useReducer } = await import('react');
  const atForms = sessionReducer =>
    sessionReducer(sessionReducer(actual.initialSession, { type: 'start' }), {
      type: 'confirmed',
      appointment: { id: 'appointment-1', status: APPOINTMENT_STATUSES.CONFIRMED },
    });
  return {
    ...actual,
    useKioskSession: () => {
      const [session, dispatch] = useReducer(actual.sessionReducer, actual.sessionReducer, atForms);
      kiosk.session = session;
      return { session, dispatch };
    },
  };
});

const instructionForm = (id, name, text) => ({
  id,
  name,
  components: [
    {
      id: `component-${id}`,
      dataElementId: `pde-${id}`,
      dataElement: { id: `pde-${id}`, code: id, type: PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION },
      text,
      screenIndex: 0,
      componentIndex: 0,
      visibilityStatus: 'current',
      visibilityCriteria: '',
    },
  ],
});

vi.mock('../../../app/views/kiosk/kioskApi', async () => {
  const { useState } = await import('react');
  return {
    useKioskAppointmentQuery: () => ({
      isLoading: false,
      isError: false,
      data: {
        appointment: { id: 'appointment-1', startTime: '2026-10-23 09:30:00' },
        patient: {
          id: 'patient-1',
          firstName: 'Tess',
          lastName: 'Lavea',
          dateOfBirth: '1986-03-14',
        },
        patientAdditionalData: null,
        forms: [
          instructionForm('survey-1', 'Contact details', 'Welcome'),
          instructionForm('survey-2', 'Health questions', 'A few questions'),
        ],
        submittedSurveyIds: kiosk.submittedSurveyIds,
      },
    }),
    useKioskSubmitFormMutation: () => {
      const [state, setState] = useState({ isLoading: false, isError: false });
      return {
        ...state,
        mutate: async ({ surveyId, buildResponse }, { onSuccess }) => {
          kiosk.submissions.push({ surveyId, ...(await buildResponse()) });
          if (kiosk.isSubmitFailing) setState({ isLoading: false, isError: true });
          else onSuccess();
        },
        reset: () => setState({ isLoading: false, isError: false }),
      };
    },
    useKioskCheckInMutation: () => ({ mutate: () => {}, isLoading: false, isError: false }),
  };
});

const renderFormsScreen = () =>
  renderElementWithTranslatedText(
    <DateTimeProviderContext.Provider
      value={{
        getCurrentDate: () => kiosk.now.slice(0, 10),
        getCurrentDateTime: () => kiosk.now,
        formatTime: value => value,
      }}
    >
      <SettingsContext.Provider value={{ getSetting: () => undefined }}>
        <FormsScreen />
      </SettingsContext.Provider>
    </DateTimeProviderContext.Provider>,
  );

const clickNext = () => userEvent.click(screen.getByTestId('kiosk-form-next'));
const formsList = () => within(screen.getByRole('navigation', { name: 'Your forms' }));

describe('Kiosk forms screen', () => {
  beforeEach(() => {
    kiosk.now = '2026-10-23 09:00:00';
    kiosk.submittedSurveyIds = [];
    kiosk.submissions = [];
    kiosk.isSubmitFailing = false;
  });

  it('submits a finished form straight away, timed from when it was shown', async () => {
    renderFormsScreen();
    expect(screen.getByText('Welcome')).toBeDefined();

    kiosk.now = '2026-10-23 09:04:00';
    await clickNext();

    expect(kiosk.submissions).toEqual([
      {
        surveyId: 'survey-1',
        answers: {},
        startTime: '2026-10-23 09:00:00',
        endTime: '2026-10-23 09:04:00',
      },
    ]);
    expect(kiosk.session.formProgress['survey-1']).toMatchObject({ status: 'completed' });
    expect(await screen.findByText('A few questions')).toBeDefined();
  });

  it('lists the forms in order, with the current one marked and none to tap', async () => {
    renderFormsScreen();
    await clickNext();

    const steps = formsList().getAllByRole('listitem');
    expect(steps.map(step => step.textContent)).toEqual([
      'Contact detailsCompleted',
      '2Health questionsPage :page of :pageCount',
    ]);
    expect(steps.map(step => step.getAttribute('aria-current'))).toEqual([null, 'step']);
    expect(formsList().queryAllByRole('button')).toHaveLength(0);
  });

  it('shows a submitted form read only on Back, and Next returns to the current form', async () => {
    renderFormsScreen();
    await clickNext();
    await screen.findByText('A few questions');

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByText('Welcome')).toBeDefined();
    expect(screen.getByText("This form has been submitted and can't be changed.")).toBeDefined();
    await clickNext();
    expect(screen.getByText('A few questions')).toBeDefined();
    expect(kiosk.submissions).toHaveLength(1);
  });

  it('counts a form submitted before the patient started over as complete', () => {
    kiosk.submittedSurveyIds = ['survey-1'];
    renderFormsScreen();

    expect(screen.getByText('A few questions')).toBeDefined();
    const steps = formsList().getAllByRole('listitem');
    expect(steps[0].textContent).toEqual('Contact detailsCompleted');
    expect(steps[1].getAttribute('aria-current')).toEqual('step');
  });

  it('skips a form submitted before the patient started over on Back', async () => {
    kiosk.submittedSurveyIds = ['survey-1'];
    renderFormsScreen();

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(kiosk.session.step).toEqual('matches');
  });

  it('keeps the form open when it cannot be submitted', async () => {
    kiosk.isSubmitFailing = true;
    renderFormsScreen();

    await clickNext();

    expect(await screen.findByText("We couldn't save your form")).toBeDefined();
    expect(kiosk.session.formProgress['survey-1']?.status).not.toEqual('completed');
    expect(screen.getByText('Welcome')).toBeDefined();
  });
});
