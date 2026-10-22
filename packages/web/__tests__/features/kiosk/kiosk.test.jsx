import { describe, expect, it } from 'vitest';
import { isValidElement } from 'react';

import { APPOINTMENT_STATUSES, PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';

import {
  formatLongDate,
  getVisibleAnswers,
  toDateParts,
  toDateString,
} from '@tamanu/ui-components';

import { toDateOfBirth } from '../../../app/views/kiosk/kioskDates';
import { toKioskForm } from '../../../app/views/kiosk/forms/kioskQuestions';
import {
  FORM_STATUSES,
  initialSession,
  KIOSK_STEPS,
  sessionReducer,
} from '../../../app/views/kiosk/KioskSession';
import { withEmphasis } from '../../../app/views/kiosk/PatientTile';

const component = (code, type, overrides = {}) => ({
  id: `component-${code}`,
  dataElementId: `pde-${code}`,
  dataElement: { id: `pde-${code}`, code, type },
  screenIndex: 0,
  componentIndex: 0,
  visibilityStatus: 'current',
  visibilityCriteria: '',
  ...overrides,
});

describe('Kiosk dates', () => {
  it('reads a date entered as day, month and year', () => {
    expect(toDateString({ day: '7', month: '3', year: '1986' })).toEqual('1986-03-07');
    expect(toDateString({ day: '30', month: '2', year: '1986' })).toBeNull();
    expect(toDateString({ day: '7', month: '', year: '1986' })).toBeNull();
    expect(toDateString({ day: '7', month: '3', year: '86' })).toBeNull();
  });

  it('only accepts dates of birth that have already happened', () => {
    expect(toDateOfBirth({ day: '14', month: '3', year: '1986' })).toEqual('1986-03-14');
    expect(toDateOfBirth({ day: '1', month: '1', year: '2999' })).toBeNull();
    expect(toDateOfBirth({ day: '1', month: '1', year: '1850' })).toBeNull();
  });

  it('splits a date back into the parts patients enter', () => {
    expect(toDateParts('1986-03-07')).toEqual({ day: '7', month: '3', year: '1986' });
    expect(toDateParts(null)).toEqual({ day: '', month: '', year: '' });
  });

  it('shows dates of birth with the month as a word', () => {
    const getTranslation = (_stringId, fallback) => fallback;
    expect(formatLongDate('1986-03-14', getTranslation)).toEqual('14 March 1986');
  });
});

describe('Kiosk forms', () => {
  const survey = {
    id: 'survey-1',
    name: 'Health questions',
    components: [
      component('Intro', PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION),
      component('Fever', PROGRAM_DATA_ELEMENT_TYPES.BINARY, { screenIndex: 2 }),
      component('Days', PROGRAM_DATA_ELEMENT_TYPES.NUMBER, {
        screenIndex: 2,
        visibilityCriteria: JSON.stringify({ Fever: 'Yes' }),
      }),
      component('Geo', PROGRAM_DATA_ELEMENT_TYPES.GEOLOCATE, { screenIndex: 5 }),
      component('Submitted', PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE),
      component('Old', PROGRAM_DATA_ELEMENT_TYPES.TEXT, { visibilityStatus: 'historical' }),
    ],
  };

  it('leaves out question types the kiosk does not support, and submission dates', () => {
    const form = toKioskForm(survey);
    expect(form.shownComponents.map(({ dataElement }) => dataElement.code)).toEqual([
      'Intro',
      'Fever',
      'Days',
    ]);
  });

  it('leaves out patient data questions that draw on a program registry', () => {
    const withPatientData = {
      ...survey,
      components: [
        component('Village', PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA, {
          config: JSON.stringify({ column: 'villageId' }),
        }),
        component('Registry', PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA, {
          config: JSON.stringify({ column: 'registrationClinicalStatus' }),
        }),
      ],
    };
    const form = toKioskForm(withPatientData);
    expect(form.shownComponents.map(({ dataElement }) => dataElement.code)).toEqual(['Village']);
  });

  it('groups the questions into pages without gaps', () => {
    const form = toKioskForm(survey);
    expect(form.pages.map(page => page.map(({ dataElement }) => dataElement.code))).toEqual([
      ['Intro'],
      ['Fever', 'Days'],
    ]);
  });

  it('saves only the answers to questions the patient could see', () => {
    const form = toKioskForm(survey);
    const values = { 'pde-Fever': 'false', 'pde-Days': '3', 'pde-Submitted': '2026-10-13' };
    expect(getVisibleAnswers(form, values)).toEqual({
      'pde-Fever': 'false',
      'pde-Submitted': '2026-10-13',
    });
    expect(getVisibleAnswers(form, { ...values, 'pde-Fever': 'true' })).toEqual({
      'pde-Fever': 'true',
      'pde-Days': '3',
      'pde-Submitted': '2026-10-13',
    });
  });
});

describe('Kiosk session', () => {
  const appointment = { id: 'appointment-1', status: APPOINTMENT_STATUSES.CONFIRMED };
  const atForms = () =>
    sessionReducer(sessionReducer(initialSession, { type: 'start' }), {
      type: 'confirmed',
      appointment,
    });

  it("remembers whether the matches are several patients or one patient's appointments", () => {
    const searched = (matches, isSeveralPatients) =>
      sessionReducer(initialSession, { type: 'searched', search: {}, matches, isSeveralPatients });
    expect(searched([{ id: 'a' }, { id: 'b' }], true).isSeveralPatients).toBe(true);
    expect(searched([{ id: 'a' }, { id: 'b' }], false).isSeveralPatients).toBe(false);
  });

  it('shows no match when nobody is found', () => {
    const session = sessionReducer(initialSession, {
      type: 'searched',
      search: { lastName: 'Tuafa' },
      matches: [],
    });
    expect(session.step).toEqual(KIOSK_STEPS.NO_MATCH);
  });

  it('tells a patient already marked arrived that they are checked in', () => {
    const session = sessionReducer(initialSession, {
      type: 'confirmed',
      appointment: { ...appointment, status: APPOINTMENT_STATUSES.ARRIVED },
    });
    expect(session.step).toEqual(KIOSK_STEPS.ALREADY_CHECKED_IN);
  });

  it('treats an appointment staff have already progressed as checked in', () => {
    const session = sessionReducer(initialSession, {
      type: 'confirmed',
      appointment: { ...appointment, status: APPOINTMENT_STATUSES.SEEN },
    });
    expect(session.step).toEqual(KIOSK_STEPS.ALREADY_CHECKED_IN);
  });

  it('marks a form in progress as soon as progress is saved', () => {
    const session = sessionReducer(atForms(), {
      type: 'saveFormProgress',
      formId: 'survey-1',
      progress: { pageIndex: 1 },
    });
    expect(session.formProgress['survey-1']).toEqual({
      status: FORM_STATUSES.IN_PROGRESS,
      pageIndex: 1,
    });
  });

  it('keeps the time the patient first opened a form', () => {
    const opened = sessionReducer(atForms(), {
      type: 'saveFormProgress',
      formId: 'survey-1',
      progress: { pageIndex: 0 },
      startTime: '2026-10-21 09:15:00',
    });
    const later = sessionReducer(opened, {
      type: 'saveFormProgress',
      formId: 'survey-1',
      progress: { pageIndex: 1 },
      startTime: '2026-10-21 09:18:00',
    });
    expect(later.formProgress['survey-1'].startTime).toEqual('2026-10-21 09:15:00');
  });

  it('does not carry answers into the next session', () => {
    const ended = sessionReducer(atForms(), { type: 'end' });
    const afterLateSave = sessionReducer(ended, {
      type: 'saveFormProgress',
      formId: 'survey-1',
      progress: { values: { 'pde-Fever': 'true' } },
    });
    expect(afterLateSave.formProgress).toEqual({});
  });

  it('keeps answers when the patient goes back and confirms the same appointment', () => {
    const withProgress = sessionReducer(atForms(), {
      type: 'saveFormProgress',
      formId: 'survey-1',
      progress: { values: { 'pde-Fever': 'true' } },
    });
    const back = sessionReducer(withProgress, { type: 'backToMatches' });
    const again = sessionReducer(back, { type: 'confirmed', appointment });
    expect(again.formProgress['survey-1'].values).toEqual({ 'pde-Fever': 'true' });

    const otherPatient = sessionReducer(back, {
      type: 'confirmed',
      appointment: { ...appointment, id: 'appointment-2' },
    });
    expect(otherPatient.formProgress).toEqual({});
  });
});

describe('withEmphasis', () => {
  it('bolds placeholder values in a translated sentence', () => {
    const parts = withEmphasis('Today at :time with :clinician', {
      time: '10:30am',
      clinician: 'Dr Sione Lee',
    });
    expect(parts.filter(part => typeof part === 'string').join('|')).toEqual('Today at | with |');
    const bolded = parts.filter(isValidElement);
    expect(bolded.map(element => element.props.children)).toEqual(['10:30am', 'Dr Sione Lee']);
  });
});
