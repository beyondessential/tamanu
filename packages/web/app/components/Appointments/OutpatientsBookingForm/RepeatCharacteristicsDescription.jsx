import React from 'react';
import { format } from 'date-fns';

import {
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_LABELS,
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS,
} from '@tamanu/constants';

import { TranslatedEnum, TranslatedText } from '../../Translation';
import { useTranslation } from '../../../contexts/Translation';
import { getWeekdayOrdinalPosition } from '@tamanu/utils/appointmentScheduling';

const useOrdinalText = (date, frequency) => {
  const { getTranslation } = useTranslation();
  if (frequency !== REPEAT_FREQUENCY.MONTHLY) return null;

  // Convert ordinal positioning to 0-based index but leave -1 as last occurrence
  const atIndex = Math.max(getWeekdayOrdinalPosition(date) - 1, -1);

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
    <TranslatedEnum enumValues={REPEAT_FREQUENCY_LABELS} value={frequency} casing='sentence' />
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

const WeeklyFrequencyText = ({ weekday, interval }) =>
  interval === 1 ? (
    <TranslatedText
      stringId="outpatientAppointments.repeating.onAWeekdayText"
      fallback="on a :weekday"
      replacements={{
        weekday,
      }}
    />
  ) : (
    <TranslatedText
      stringId="outpatientAppointments.repeating.onWeekDayText"
      fallback="on :weekday"
      replacements={{
        weekday,
      }}
    />
  );

const FrequencyText = ({ frequency, interval, startTimeDate }) => {
  const weekday = format(startTimeDate, 'EEEE');
  const ordinalText = useOrdinalText(startTimeDate, frequency);
  return frequency === REPEAT_FREQUENCY.WEEKLY ? (
    <WeeklyFrequencyText weekday={weekday} interval={interval} />
  ) : (
    <TranslatedText
      stringId="outpatientAppointments.repeating.onTheNthWeekdayText"
      fallback="on the :nth :weekday"
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
      <FrequencyText frequency={frequency} interval={interval} startTimeDate={startTimeDate} />
    </>
  ) : (
    <TranslatedText
      stringId="outpatientAppointment.repeating.error.invalidInterval"
      fallback="Invalid interval"
    />
  );
