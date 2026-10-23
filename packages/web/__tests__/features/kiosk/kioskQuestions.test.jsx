import React from 'react';
import { describe, expect, it } from 'vitest';
import { Formik } from 'formik';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import {
  DateTimeProviderContext,
  SettingsContext,
  toTimeParts,
  toTimeString,
} from '@tamanu/ui-components';
import { toFacilityDateTime, toStoredDateTime } from '@tamanu/utils/dateTime';

import { renderElementWithTranslatedText } from '../../helpers';
import {
  getKioskComponentForQuestionType,
  toKioskForm,
} from '../../../app/views/kiosk/forms/kioskQuestions';
import { KioskSurveyForm } from '../../../app/views/kiosk/forms/KioskSurveyForm';

const T = PROGRAM_DATA_ELEMENT_TYPES;

/** Stands in for the facility timezone being the primary timezone. */
const dateTimeContext = {
  toFacilityDateTime: value => value?.replace(' ', 'T').slice(0, 16) ?? null,
  toStoredDateTime: value => `${value.replace('T', ' ')}:00`,
};

/** Renders one kiosk question in a form and reports the answer it last set. */
const renderQuestion = (type, props = {}, initialValue, timeZoneContext = dateTimeContext) => {
  const Question = getKioskComponentForQuestionType(type, props.config);
  const answers = [];
  const field = { name: 'answer', value: initialValue };
  const QuestionInForm = () => (
    <Formik initialValues={{ answer: initialValue }} onSubmit={() => {}}>
      {({ values, setFieldValue }) => {
        answers.push(values.answer);
        return (
          <Question
            field={{
              ...field,
              value: values.answer,
              onChange: event => setFieldValue('answer', event.target.value),
            }}
            label="Question"
            {...props}
          />
        );
      }}
    </Formik>
  );
  renderElementWithTranslatedText(
    <DateTimeProviderContext.Provider value={timeZoneContext}>
      <QuestionInForm />
    </DateTimeProviderContext.Provider>,
  );
  return { lastAnswer: () => answers.at(-1) };
};

describe('Kiosk time parts', () => {
  it('turns hour, minute and am/pm into a 24-hour time', () => {
    expect(toTimeString({ hour: '7', minute: '30', period: 'pm' })).toEqual('19:30:00');
    expect(toTimeString({ hour: '12', minute: '5', period: 'am' })).toEqual('00:05:00');
    expect(toTimeString({ hour: '12', minute: '00', period: 'pm' })).toEqual('12:00:00');
    expect(toTimeString({ hour: '13', minute: '00', period: 'pm' })).toBeNull();
    expect(toTimeString({ hour: '7', minute: '30', period: '' })).toBeNull();
  });

  it('splits a 24-hour time back into the parts patients enter', () => {
    expect(toTimeParts('19:30:00')).toEqual({ hour: '7', minute: '30', period: 'pm' });
    expect(toTimeParts('00:05')).toEqual({ hour: '12', minute: '05', period: 'am' });
    expect(toTimeParts(null)).toEqual({ hour: '', minute: '', period: '' });
  });
});

describe('Kiosk questions store answers as the web does', () => {
  it('stores a number, and no answer for an empty box', async () => {
    const { lastAnswer } = renderQuestion(T.NUMBER);
    await userEvent.type(screen.getByRole('textbox'), '7');
    expect(lastAnswer()).toEqual('7');
    await userEvent.clear(screen.getByRole('textbox'));
    expect(lastAnswer()).toBeNull();
  });

  it('stores yes/no as true and false', async () => {
    const { lastAnswer } = renderQuestion(T.BINARY);
    await userEvent.click(screen.getByRole('radio', { name: 'No' }));
    expect(lastAnswer()).toEqual('false');
    await userEvent.click(screen.getByRole('radio', { name: 'Yes' }));
    expect(lastAnswer()).toEqual('true');
  });

  it('leaves a required tick box unanswered when unticked', async () => {
    const { lastAnswer } = renderQuestion(T.CHECKBOX);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(lastAnswer()).toEqual('true');
    await userEvent.click(screen.getByRole('checkbox'));
    expect(lastAnswer()).toBeNull();
  });

  it('stores multiple choice as a JSON list', async () => {
    const options = ['Fever', 'Cough'].map(value => ({ value, label: value }));
    const { lastAnswer } = renderQuestion(T.MULTI_SELECT, { options });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Fever' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Cough' }));
    expect(JSON.parse(lastAnswer())).toEqual(['Fever', 'Cough']);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Fever' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Cough' }));
    expect(lastAnswer()).toBeNull();
  });

  it('lists a few options as buttons, and many in a dropdown', () => {
    const options = count =>
      Array.from({ length: count }, (_, index) => ({
        value: `${index}`,
        label: `Option ${index}`,
      }));
    renderQuestion(T.SELECT, { options: options(3) });
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    renderQuestion(T.SELECT, { options: options(12) });
    expect(screen.getByRole('combobox')).toBeDefined();
  });

  it('stores a date once day, month and year make a real date', async () => {
    const { lastAnswer } = renderQuestion(T.DATE);
    await userEvent.type(screen.getByLabelText('Day'), '30');
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '2' } });
    await userEvent.type(screen.getByLabelText('Year'), '2026');
    // Half entered, or not a real date, is held as an answer the validation rejects
    expect(lastAnswer()).toEqual('incomplete');
    await userEvent.clear(screen.getByLabelText('Day'));
    await userEvent.type(screen.getByLabelText('Day'), '28');
    expect(lastAnswer()).toEqual('2026-02-28');
  });

  it('leaves a date unanswered once its parts are cleared', async () => {
    const { lastAnswer } = renderQuestion(T.DATE);
    await userEvent.type(screen.getByLabelText('Day'), '3');
    await userEvent.clear(screen.getByLabelText('Day'));
    expect(lastAnswer()).toBeUndefined();
  });

  it('asks for the rest of a half-entered date', async () => {
    renderQuestion(T.DATE, { error: true, helperText: 'This question is required' });
    await userEvent.type(screen.getByLabelText('Day'), '3');
    expect(screen.getByRole('alert').textContent).toEqual('Enter the full date');
  });

  it('stores a time as HH:mm:ss', async () => {
    const { lastAnswer } = renderQuestion(T.TIME);
    await userEvent.type(screen.getByLabelText('Hour'), '7');
    await userEvent.type(screen.getByLabelText('Minute'), '30');
    expect(lastAnswer()).toEqual('incomplete');
    await userEvent.click(screen.getByRole('button', { name: 'pm' }));
    expect(lastAnswer()).toEqual('19:30:00');
  });

  it('stores a date and time in the primary timezone, and shows a saved one', async () => {
    const { lastAnswer } = renderQuestion(T.DATE_TIME, {}, '2026-10-09 20:05:00');
    expect(screen.getByLabelText('Hour').value).toEqual('8');
    expect(screen.getByRole('button', { name: 'pm' }).getAttribute('aria-pressed')).toEqual('true');
    await userEvent.click(screen.getByRole('button', { name: 'am' }));
    expect(lastAnswer()).toEqual('2026-10-09 08:05:00');
  });

  it('stores a facility-local date and time in the primary timezone, and shows a saved one locally', async () => {
    const primaryTimeZone = 'Pacific/Auckland';
    const facilityTimeZone = 'Australia/Brisbane';
    const { lastAnswer } = renderQuestion(T.DATE_TIME, {}, '2026-10-09 20:05:00', {
      toFacilityDateTime: value => toFacilityDateTime(value, primaryTimeZone, facilityTimeZone),
      toStoredDateTime: value => toStoredDateTime(value, primaryTimeZone, facilityTimeZone),
    });
    expect(screen.getByLabelText('Hour').value).toEqual('5');
    expect(screen.getByRole('button', { name: 'pm' }).getAttribute('aria-pressed')).toEqual('true');
    await userEvent.click(screen.getByRole('button', { name: 'am' }));
    expect(lastAnswer()).toEqual('2026-10-09 08:05:00');
  });

  it('answers a write-back patient data question like its field type', () => {
    renderQuestion(
      T.PATIENT_DATA,
      { config: { column: 'email', writeToPatient: { fieldName: 'email', fieldType: T.TEXT } } },
      'tess@example.com',
    );
    expect(screen.getByRole('textbox').readOnly).toBe(false);
  });
});

describe('Kiosk survey form', () => {
  const renderForm = props =>
    renderElementWithTranslatedText(
      <DateTimeProviderContext.Provider
        value={{
          getCurrentDate: () => '2026-10-23',
          getCurrentDateTime: () => '2026-10-23 09:00:00',
        }}
      >
        <SettingsContext.Provider value={{ getSetting: () => undefined }}>
          <KioskSurveyForm onComplete={() => {}} onExit={() => {}} {...props} />
        </SettingsContext.Provider>
      </DateTimeProviderContext.Provider>,
    );

  it('shows a form with no questions it can show as one finished page', () => {
    const form = toKioskForm({ id: 'survey-empty', name: 'Empty', components: [] });
    renderForm({ form });
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar.getAttribute('aria-valuenow')).toEqual('1');
    expect(progressBar.firstChild.style.width).toEqual('100%');
  });

  it('opens a form asking for a custom patient field for a patient without field values', () => {
    const form = toKioskForm({
      id: 'survey-custom-field',
      name: 'Custom field',
      components: [
        {
          id: 'component-Custom',
          dataElementId: 'pde-Custom',
          dataElement: { id: 'pde-Custom', code: 'Custom', type: T.PATIENT_DATA, name: 'Custom' },
          config: JSON.stringify({ column: 'fieldDefinition-shoeSize' }),
          screenIndex: 0,
          componentIndex: 0,
          visibilityStatus: 'current',
          visibilityCriteria: '',
          text: 'Shoe size',
        },
      ],
    });
    renderForm({
      form,
      patient: { id: 'patient-1', firstName: 'Tess', lastName: 'Lavea', dateOfBirth: '1986-03-14' },
    });
    expect(screen.getByText('Shoe size')).toBeDefined();
  });
});
