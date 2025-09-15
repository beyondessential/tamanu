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
import { Box } from '@material-ui/core';
import { Colors } from '../../../constants';

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
    <TranslatedEnum
      enumValues={REPEAT_FREQUENCY_LABELS}
      value={frequency}
      casing="sentence"
      data-testid="translatedenum-1uti"
    />
  ) : (
    <TranslatedText
      stringId="outpatientAppointments.repeating.onNthWeekdayText"
      fallback="Every :interval :frequency"
      replacements={{
        interval,
        frequency: getEnumTranslation(REPEAT_FREQUENCY_UNIT_PLURAL_LABELS, frequency),
      }}
      data-testid="translatedtext-3jsc"
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
      data-testid="translatedtext-gfhz"
    />
  ) : (
    <TranslatedText
      stringId="outpatientAppointments.repeating.onWeekDayText"
      fallback="on :weekday"
      replacements={{
        weekday,
      }}
      data-testid="translatedtext-bzpt"
    />
  );

const FrequencyText = ({ frequency, interval, startTimeDate }) => {
  const weekday = format(startTimeDate, 'EEEE');
  const ordinalText = useOrdinalText(startTimeDate, frequency);
  return frequency === REPEAT_FREQUENCY.WEEKLY ? (
    <WeeklyFrequencyText
      weekday={weekday}
      interval={interval}
      data-testid="weeklyfrequencytext-cruk"
    />
  ) : (
    <TranslatedText
      stringId="outpatientAppointments.repeating.onTheNthWeekdayText"
      fallback="on the :nth :weekday"
      replacements={{
        nth: ordinalText,
        weekday,
      }}
      data-testid="translatedtext-fvaa"
    />
  );
};

export const RepeatCharacteristicsDescription = ({ startTimeDate, frequency, interval }) =>
  interval ? (
    <>
      <Box component="span" fontWeight={500} color={Colors.darkText}>
        <TranslatedText
          stringId="outpatientAppointment.repeating.repeatsOnText"
          fallback="Repeats on:"
          data-testid="translatedtext-ilje"
        />
      </Box>{' '}
      <IntervalText frequency={frequency} interval={interval} data-testid="intervaltext-k7ig" />{' '}
      <FrequencyText
        frequency={frequency}
        interval={interval}
        startTimeDate={startTimeDate}
        data-testid="frequencytext-d414"
      />
    </>
  ) : (
    <TranslatedText
      stringId="outpatientAppointment.repeating.error.invalidInterval"
      fallback="Invalid interval"
      data-testid="translatedtext-fbc7"
    />
  );
