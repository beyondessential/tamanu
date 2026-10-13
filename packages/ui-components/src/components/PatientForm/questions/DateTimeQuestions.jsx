import React, { useId, useState } from 'react';
import styled from 'styled-components';

import { useDateTime } from '@tamanu/ui-components';

import { TranslatedText } from '../../../../components';
import { useTranslation } from '../../../../contexts/Translation';
import { DateParts, digitsOnly, PartsGrid } from '../../DateParts';
import { toDateParts, toDateString } from '../../kioskDates';
import { scaled, SubLabel } from '../../kioskStyles';
import { Question, QuestionInput, QuestionSelect, setFieldValue } from './QuestionLayout';
import { toTimeParts, toTimeString } from './timeParts';

const Segmented = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${scaled(4)};
  min-height: ${scaled(60)};
  padding: ${scaled(4)};
  border-radius: 14px;
  background: var(--kiosk-option);
  box-shadow: inset 0 0 0 var(--kiosk-border) var(--kiosk-option-edge);
`;

const SegmentButton = styled.button.attrs({ type: 'button' })`
  border: none;
  border-radius: 11px;
  background: transparent;
  color: var(--kiosk-text-secondary);
  font-size: ${scaled(18)};
  font-weight: 500;
  cursor: pointer;

  &[aria-pressed='true'] {
    background: var(--kiosk-surface);
    color: var(--kiosk-primary);
    box-shadow: inset 0 0 0 var(--kiosk-border) var(--kiosk-outline);
  }
`;

/** The date and time boxes of a question, kept to a sensible width. */
const PartsStack = styled.div`
  display: grid;
  gap: ${scaled(12)};
  max-width: ${scaled(520)};
`;

/** Dates in forms use the question-sized boxes. */
const DateQuestionParts = props => (
  <DateParts Input={QuestionInput} Select={QuestionSelect} {...props} />
);

/** Hour, minute and am/pm. */
const TimeParts = ({ parts, onChange, error }) => {
  const { getTranslation } = useTranslation();
  const idPrefix = useId();
  return (
    <PartsGrid>
      <div>
        <SubLabel htmlFor={`${idPrefix}-hour`}>
          <TranslatedText stringId="kiosk.time.hour" fallback="Hour" />
        </SubLabel>
        <QuestionInput
          id={`${idPrefix}-hour`}
          value={parts.hour}
          onChange={event => onChange({ ...parts, hour: digitsOnly(event.target.value) })}
          inputMode="numeric"
          maxLength={2}
          autoComplete="off"
          aria-invalid={error}
        />
      </div>
      <div>
        <SubLabel htmlFor={`${idPrefix}-minute`}>
          <TranslatedText stringId="kiosk.time.minute" fallback="Minute" />
        </SubLabel>
        <QuestionInput
          id={`${idPrefix}-minute`}
          value={parts.minute}
          onChange={event => onChange({ ...parts, minute: digitsOnly(event.target.value) })}
          inputMode="numeric"
          maxLength={2}
          autoComplete="off"
          aria-invalid={error}
        />
      </div>
      <div>
        <SubLabel as="div">&nbsp;</SubLabel>
        <Segmented role="group" aria-label={getTranslation('kiosk.time.period', 'am or pm')}>
          {['am', 'pm'].map(period => (
            <SegmentButton
              key={period}
              aria-pressed={parts.period === period}
              onClick={() => onChange({ ...parts, period })}
            >
              {period === 'am'
                ? getTranslation('kiosk.time.am', 'am')
                : getTranslation('kiosk.time.pm', 'pm')}
            </SegmentButton>
          ))}
        </Segmented>
      </div>
    </PartsGrid>
  );
};

/** Fails the shared date and time validation, so a half-entered answer can't be skipped past. */
const INCOMPLETE_ANSWER = 'incomplete';

const isAnyPartEntered = parts => Object.values(parts).some(Boolean);

/**
 * The parts a patient has entered are kept here as they type, and the answer is set once they
 * make a whole value (`toAnswer` returns null until then). Nothing entered leaves the question
 * unanswered; something half entered is held as an invalid answer, so the patient is asked to
 * finish it rather than having it quietly dropped.
 */
const usePartsAnswer = (field, initialParts, toAnswer) => {
  const [parts, setParts] = useState(initialParts);
  const updateParts = nextParts => {
    setParts(nextParts);
    const answer = toAnswer(nextParts);
    setFieldValue(field, answer ?? (isAnyPartEntered(nextParts) ? INCOMPLETE_ANSWER : undefined));
  };
  const isPartlyEntered = isAnyPartEntered(parts) && !toAnswer(parts);
  return [parts, updateParts, isPartlyEntered];
};

/** A half-entered date or time says what's missing, rather than that nothing was entered. */
const useIncompleteMessage = (isPartlyEntered, error, helperText, stringId, fallback) => {
  const { getTranslation } = useTranslation();
  return isPartlyEntered && error ? getTranslation(stringId, fallback) : helperText;
};

/** Stored as `yyyy-MM-dd`, like the shared date field. */
export const DateQuestion = ({ field, label, required, error, helperText }) => {
  const [parts, setParts, isPartlyEntered] = usePartsAnswer(
    field,
    () => toDateParts(field.value),
    toDateString,
  );
  const message = useIncompleteMessage(
    isPartlyEntered,
    error,
    helperText,
    'kiosk.date.incomplete',
    'Enter the full date',
  );
  return (
    <Question {...{ label, required, error }} helperText={message}>
      <PartsStack>
        <DateQuestionParts parts={parts} onChange={setParts} error={error} />
      </PartsStack>
    </Question>
  );
};

/** Stored as `HH:mm:ss`, like the shared time field. */
export const TimeQuestion = ({ field, label, required, error, helperText }) => {
  const [parts, setParts, isPartlyEntered] = usePartsAnswer(
    field,
    () => toTimeParts(field.value),
    toTimeString,
  );
  const message = useIncompleteMessage(
    isPartlyEntered,
    error,
    helperText,
    'kiosk.time.incomplete',
    'Enter the full time',
  );
  return (
    <Question {...{ label, required, error }} helperText={message}>
      <PartsStack>
        <TimeParts parts={parts} onChange={setParts} error={error} />
      </PartsStack>
    </Question>
  );
};

/**
 * Entered in the facility's time and stored in the primary timezone, like the shared date and
 * time field.
 */
export const DateTimeQuestion = ({ field, label, required, error, helperText }) => {
  const { toFacilityDateTime, toStoredDateTime } = useDateTime();
  const [parts, setParts, isPartlyEntered] = usePartsAnswer(
    field,
    () => {
      const [date, time] = (field.value ? toFacilityDateTime(field.value) : '')?.split('T') ?? [];
      return { ...toDateParts(date), ...toTimeParts(time) };
    },
    nextParts => {
      const date = toDateString(nextParts);
      const time = toTimeString(nextParts);
      return date && time ? toStoredDateTime(`${date}T${time.slice(0, 5)}`) : null;
    },
  );
  const message = useIncompleteMessage(
    isPartlyEntered,
    error,
    helperText,
    'kiosk.dateTime.incomplete',
    'Enter the full date and time',
  );
  return (
    <Question {...{ label, required, error }} helperText={message}>
      <PartsStack>
        <DateQuestionParts parts={parts} onChange={setParts} error={error} />
        <TimeParts parts={parts} onChange={setParts} error={error} />
      </PartsStack>
    </Question>
  );
};
