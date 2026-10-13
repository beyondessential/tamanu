import React, { useId, useState } from 'react';
import styled from 'styled-components';

import { useDateTime } from '@tamanu/ui-components';

import { TranslatedText } from '../../../../components';
import { useTranslation } from '../../../../contexts/Translation';
import { MONTHS, toDateParts, toDateString } from '../../kioskDates';
import { scaled, SubLabel } from '../../kioskStyles';
import { Question, QuestionInput, QuestionSelect, setFieldValue } from './QuestionLayout';
import { toTimeParts, toTimeString } from './timeParts';

const PartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.8fr 1.3fr;
  gap: ${scaled(12)};
  max-width: ${scaled(520)};

  & + & {
    margin-top: ${scaled(12)};
  }
`;

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

const digitsOnly = value => value.replace(/\D/g, '');

/** Day, month by name and year: how patients enter every date at the kiosk. */
const DateParts = ({ parts, onChange, error }) => {
  const { getTranslation } = useTranslation();
  const idPrefix = useId();
  return (
    <PartsGrid>
      <div>
        <SubLabel htmlFor={`${idPrefix}-day`}>
          <TranslatedText stringId="kiosk.date.day" fallback="Day" />
        </SubLabel>
        <QuestionInput
          id={`${idPrefix}-day`}
          value={parts.day}
          onChange={event => onChange({ ...parts, day: digitsOnly(event.target.value) })}
          inputMode="numeric"
          maxLength={2}
          autoComplete="off"
          aria-invalid={error}
        />
      </div>
      <div>
        <SubLabel htmlFor={`${idPrefix}-month`}>
          <TranslatedText stringId="kiosk.date.month" fallback="Month" />
        </SubLabel>
        <QuestionSelect
          id={`${idPrefix}-month`}
          value={parts.month}
          onChange={event => onChange({ ...parts, month: event.target.value })}
          aria-invalid={error}
        >
          <option value="" disabled hidden>
            {getTranslation('kiosk.date.selectMonth', 'Select')}
          </option>
          {MONTHS.map(({ stringId, fallback }, index) => (
            <option key={stringId} value={String(index + 1)}>
              {getTranslation(stringId, fallback)}
            </option>
          ))}
        </QuestionSelect>
      </div>
      <div>
        <SubLabel htmlFor={`${idPrefix}-year`}>
          <TranslatedText stringId="kiosk.date.year" fallback="Year" />
        </SubLabel>
        <QuestionInput
          id={`${idPrefix}-year`}
          value={parts.year}
          onChange={event => onChange({ ...parts, year: digitsOnly(event.target.value) })}
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
          aria-invalid={error}
        />
      </div>
    </PartsGrid>
  );
};

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

/**
 * The parts a patient has entered are kept here as they type, and the answer is set only once
 * they make a whole value. `toAnswer` returns null until then.
 */
const usePartsAnswer = (field, initialParts, toAnswer) => {
  const [parts, setParts] = useState(initialParts);
  const updateParts = nextParts => {
    setParts(nextParts);
    setFieldValue(field, toAnswer(nextParts));
  };
  return [parts, updateParts];
};

/** Stored as `yyyy-MM-dd`, like the shared date field. */
export const DateQuestion = ({ field, label, required, error, helperText }) => {
  const [parts, setParts] = usePartsAnswer(field, () => toDateParts(field.value), toDateString);
  return (
    <Question {...{ label, required, error, helperText }}>
      <DateParts parts={parts} onChange={setParts} error={error} />
    </Question>
  );
};

/** Stored as `HH:mm:ss`, like the shared time field. */
export const TimeQuestion = ({ field, label, required, error, helperText }) => {
  const [parts, setParts] = usePartsAnswer(field, () => toTimeParts(field.value), toTimeString);
  return (
    <Question {...{ label, required, error, helperText }}>
      <TimeParts parts={parts} onChange={setParts} error={error} />
    </Question>
  );
};

/**
 * Entered in the facility's time and stored in the primary timezone, like the shared date and
 * time field.
 */
export const DateTimeQuestion = ({ field, label, required, error, helperText }) => {
  const { toFacilityDateTime, toStoredDateTime } = useDateTime();
  const [parts, setParts] = usePartsAnswer(
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
  return (
    <Question {...{ label, required, error, helperText }}>
      <DateParts parts={parts} onChange={setParts} error={error} />
      <TimeParts parts={parts} onChange={setParts} error={error} />
    </Question>
  );
};
