import { styled } from '@mui/material/styles';
import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import FormControlLabel, { formControlLabelClasses } from '@mui/material/FormControlLabel';
import Radio, { radioClasses } from '@mui/material/Radio';
import { typographyClasses } from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import {
  format,
  add,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
  parseISO,
} from 'date-fns';

import {
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_LABELS,
  REPEAT_FREQUENCY_UNIT_LABELS,
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS,
} from '@tamanu/constants';

import { Colors } from '../../../constants';
import { DateField, Field, NumberField, TranslatedSelectField } from '../../Field';
import { TranslatedEnum, TranslatedText } from '../../Translation';
import { SmallBodyText } from '../../Typography';
import { useTranslation } from '../../../contexts/Translation';

const Container = styled('div')`
  width: 100%;
  background: ${Colors.white};
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0.5rem;
  border: 0.063rem solid ${Colors.outline};
`;

const StyledNumberField = styled(NumberField)`
  width: 117px;
  & .label-field {
    font-size: 12px;
  }
  & .MuiInputBase-input {
    font-size: 12px;
    padding-block: 10px;
    padding-inline: 13px 10px;
  }
`;

const StyledTranslatedSelectField = styled(TranslatedSelectField)`
  & .MuiFormControl-root {
    > div > div:first-of-type {
      font-size: 12px;
      min-height: 0;
      padding-top: 9px;
      padding-bottom: 7px;
    }
    width: 108px;
    margin-block-start: 23px;
  }
`;

const StyledRadio = styled(Radio)`
  &.${radioClasses.root} {
    color: ${Colors.primary};
    padding: 2px;
  }
  & svg {
    width: 1.2rem;
    height: 1.2rem;
  }
`;

const StyledFormControlLabel = styled(FormControlLabel)`
  &.${formControlLabelClasses.root} {
    margin-left: 0;
    margin-right: 0;
    & .${typographyClasses.root} {
      width: 40px;
      margin-left: 0.5rem;
      font-size: 12px;
      color: ${Colors.darkText};
    }
  }
`;

const StyledDateField = styled(DateField)`
  & .MuiInputBase-input {
    padding-block: 10px;
    padding-inline: 13px 10px;
    font-size: 12px;
    &.Mui-disabled {
      background-color: ${Colors.background};
    }
  }
`;

const StyledFormLabel = styled(FormLabel)`
  font-size: 12px;
  font-weight: 500;
`;

const StyledRadioGroup = styled(RadioGroup)`
  gap: 10px;
`;

export const repeatingAppointmentInitialValues = {
  interval: 1,
  frequency: REPEAT_FREQUENCY.WEEKLY,
};

const END_MODES = {
  ON: 'on',
  AFTER: 'after',
};

export const getNthWeekday = date => {
  // Filter out days from month that are not the same weekday as the date
  const matchingWeekdays = eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  }).filter(day => day.getDay() === date.getDay());

  // Ordinal positioning is 1-based, -1 means the date is the last occurrence weekday of the month
  const nthWeekday = matchingWeekdays.findIndex(day => isSameDay(day, date)) + 1;
  return nthWeekday === matchingWeekdays.length ? -1 : nthWeekday;
};

const useOrdinalText = (date, frequency) => {
  const { getTranslation } = useTranslation();
  if (frequency !== REPEAT_FREQUENCY.MONTHLY) return null;

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
  if (interval === 1)
    return <TranslatedEnum enumValues={REPEAT_FREQUENCY_LABELS} value={frequency} />;
  return (
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
  if (frequency === REPEAT_FREQUENCY.WEEKLY) {
    return (
      <TranslatedText
        stringId="outpatientAppointments.repeating.onWeekdayText"
        fallback="on a :weekday"
        replacements={{
          weekday,
        }}
      />
    );
  }
  return (
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

const RepeatText = ({ startTimeDate, frequency, interval }) => (
  <>
    <TranslatedText
      stringId="outpatientAppointment.repeating.repeatsOnText"
      fallback="Repeats on:"
    />
    &nbsp;
    <IntervalText frequency={frequency} interval={interval} />
    &nbsp;
    <FrequencyText frequency={frequency} startTimeDate={startTimeDate} />
  </>
);

export const RepeatingDateFields = ({ values, setFieldValue, handleResetUntilDate }) => {
  const { startTime, appointmentSchedule } = values;
  const { interval, frequency, occurrenceCount, untilDate } = appointmentSchedule;
  const startTimeDate = useMemo(() => parseISO(startTime), [startTime]);

  const [endsMode, setEndsMode] = useState(END_MODES.ON);

  const handleChangeEndsMode = e => {
    const newValue = e.target.value;
    if (newValue === END_MODES.ON) {
      handleResetUntilDate(startTimeDate);
      setFieldValue('appointmentSchedule.occurrenceCount', null);
    } else {
      setFieldValue(
        'appointmentSchedule.occurrenceCount',
        repeatingAppointmentInitialValues.occurrenceCount,
      );
      setFieldValue('appointmentSchedule.untilDate', null);
    }
    setEndsMode(newValue);
  };

  const handleFrequencyChange = e => {
    setFieldValue(
      'appointmentSchedule.nthWeekday',
      e.target.value === REPEAT_FREQUENCY.MONTHLY ? getNthWeekday(startTimeDate) : null,
    );
  };

  return (
    <Container>
      <Box display="flex" gap="0.5rem" height="100%">
        <Field
          name="appointmentSchedule.interval"
          min={1}
          label={
            <TranslatedText
              stringId="outpatientAppointment.repeating.repeatEvery.label"
              fallback="Repeats every"
            />
          }
          component={StyledNumberField}
        />
        <Field
          placeholder=""
          name="appointmentSchedule.frequency"
          isClearable={false}
          enumValues={
            interval === 1 ? REPEAT_FREQUENCY_UNIT_LABELS : REPEAT_FREQUENCY_UNIT_PLURAL_LABELS
          }
          onChange={handleFrequencyChange}
          component={StyledTranslatedSelectField}
        />
      </Box>
      <Box>
        <SmallBodyText>
          <RepeatText startTimeDate={startTimeDate} frequency={frequency} interval={interval} />
        </SmallBodyText>
      </Box>
      <FormControl variant="standard">
        <StyledFormLabel id="ends-radio">
          <TranslatedText stringId="outpatientAppointment.repeating.ends.label" fallback="Ends" />
        </StyledFormLabel>
        <StyledRadioGroup
          aria-labelledby="ends-radio"
          value={endsMode}
          onChange={handleChangeEndsMode}
        >
          <Box display="flex" alignItems="center" gap="10px">
            <StyledFormControlLabel
              value={END_MODES.ON}
              control={<StyledRadio />}
              label={
                <TranslatedText
                  stringId="outpatientAppointment.repeating.ends.option.on"
                  fallback="On"
                />
              }
            />
            <Field
              name="appointmentSchedule.untilDate"
              disabled={endsMode !== END_MODES.ON}
              value={endsMode === END_MODES.ON ? untilDate : ''}
              min={format(
                add(startTimeDate, {
                  [`${REPEAT_FREQUENCY_UNIT_PLURAL_LABELS[frequency]}`]: interval,
                }),
                'yyyy-MM-dd',
              )}
              component={StyledDateField}
            />
          </Box>
          <Box display="flex" alignItems="center" gap="10px">
            <StyledFormControlLabel
              value={END_MODES.AFTER}
              control={<StyledRadio />}
              label={
                <TranslatedText
                  stringId="outpatientAppointment.repeating.ends.option.after"
                  fallback="After"
                />
              }
            />
            <Field
              name="appointmentSchedule.occurrenceCount"
              sx={{
                width: '60px',
              }}
              min={0}
              value={endsMode === END_MODES.AFTER ? occurrenceCount : ''}
              disabled={endsMode !== END_MODES.AFTER}
              component={StyledNumberField}
            />
            <SmallBodyText color="textTertiary">
              <TranslatedText
                stringId="outpatientAppointment.repeating.occurrenceCount.label"
                fallback="occurrences"
              />
            </SmallBodyText>
          </Box>
        </StyledRadioGroup>
      </FormControl>
    </Container>
  );
};
