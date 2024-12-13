import React from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';

import {
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_LABELS,
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS,
} from '@tamanu/constants';

import { TranslatedEnum, TranslatedText } from '../../Translation';
import { useTranslation } from '../../../contexts/Translation';

export const eachWeekdayOfMonth = date => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end }).filter(day => day.getDay() === date.getDay());
};

export const getNthWeekday = date => {
  const matchingWeekdays = eachWeekdayOfMonth(date);

  // Ordinal positioning is 1-based, -1 means the date is the last occurrence of the weekday in the month
  const nthWeekday = matchingWeekdays.findIndex(day => isSameDay(day, date)) + 1;
  return nthWeekday === matchingWeekdays.length ? -1 : nthWeekday;
};

const useOrdinalText = (date, frequency) => {
  const { getTranslation } = useTranslation();
  if (frequency !== REPEAT_FREQUENCY.MONTHLY) return null;

  // TODO use values
  // Convert ordinal positioning to 0-based index but leave -1 as last occurrence
  const atIndex = Math.max(getNthWeekday(date) - 1, -1);

  return [
    getTranslation('general.ordinals.first', 'first'),
    getTranslation('general.ordinals.second', 'second'),
    getTranslation('general.ordinals.third', 'third'),
    getTranslation('general.ordinals.fourth', 'fourth'),
    getTranslation('general.ordinals.last', 'last'),
  ].at(atIndex);
};

const IntervalText = ({ interval, frequency }) => {
  const { getEnumTranslation } = useTranslation();
  return interval === 1 ? (
    <TranslatedEnum enumValues={REPEAT_FREQUENCY_LABELS} value={frequency} />
  ) : (
    <TranslatedText
      stringId="outpatientAppointments.repeating.onNthWeekdayText"
      fallback="Every :interval :frequency"
      replacements={{
        interval,
        frequency: getEnumTranslation(REPEAT_FREQUENCY_UNIT_PLURAL_LABELS, frequency),
      }}
    />
  );
};

const FrequencyText = ({ frequency, startTimeDate }) => {
  const weekday = format(startTimeDate, 'EEEE');
  const ordinalText = useOrdinalText(startTimeDate, frequency);
  return frequency === REPEAT_FREQUENCY.WEEKLY ? (
    <TranslatedText
      stringId="outpatientAppointments.repeating.onWeekdayText"
      fallback="on a :weekday"
      replacements={{
        weekday,
      }}
    />
  ) : (
    <TranslatedText
      stringId="outpatientAppointments.repeating.onNthWeekdayText"
      fallback="on :nth :weekday"
      replacements={{
        nth: ordinalText,
        weekday,
      }}
    />
  );
};

export const RepeatCharacteristicsDescription = ({ startTimeDate, frequency, interval }) =>
  interval ? (
    <>
      <TranslatedText
        stringId="outpatientAppointment.repeating.repeatsOnText"
        fallback="Repeats on:"
      />{' '}
      <IntervalText frequency={frequency} interval={interval} />{' '}
      <FrequencyText frequency={frequency} startTimeDate={startTimeDate} />
    </>
  ) : (
    <TranslatedText
      stringId="outpatientAppointment.repeating.error.invalidInterval"
      fallback="Invalid interval"
    />
  );
