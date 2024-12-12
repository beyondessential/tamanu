import { styled } from '@mui/material/styles';
import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import {
  format,
  add,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { FormControl, FormLabel } from '@material-ui/core';

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
  &.MuiRadio-root {
    color: ${Colors.primary};
    padding: 2px;
  }
  & svg {
    width: 1.2rem;
    height: 1.2rem;
  }
`;

const StyledFormControlLabel = styled(FormControlLabel)`
  &.MuiFormControlLabel-root {
    margin-left: 0;
    margin-right: 0;
    & .MuiTypography-root {
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

const REPEAT_TYPES = {
  ON: 'on',
  AFTER: 'after',
};

export const addSixFrequencyToDate = (date, frequency, interval) =>
  add(date, { [`${REPEAT_FREQUENCY_UNIT_PLURAL_LABELS[frequency]}`]: 6 * interval });

const RepeatText = ({ startTimeDate, frequency, interval }) => {
  const { getTranslation, getEnumTranslation } = useTranslation();
  const weekday = format(startTimeDate, 'EEEE');
  const weeksInMonth = eachDayOfInterval({
    start: startOfMonth(startTimeDate),
    end: endOfMonth(startTimeDate),
  });
  const weekdayMatchesInMonth = weeksInMonth.filter(day => day.getDay() === startTimeDate.getDay());
  const weekdayInMonthIndex = weekdayMatchesInMonth.findIndex(day => isSameDay(day, startTimeDate));

  const getOrdinalText = n => {
    if (weekdayMatchesInMonth.length === n + 1) {
      return getTranslation('general.ordinals.last', 'last');
    }
    return [
      getTranslation('general.ordinals.first', 'first'),
      getTranslation('general.ordinals.second', 'second'),
      getTranslation('general.ordinals.third', 'third'),
      getTranslation('general.ordinals.fourth', 'fourth'),
    ][n];
  };

  return (
    <>
      <TranslatedText
        stringId="outpatientAppointment.repeatAppointment.repeatsOnText"
        fallback="Repeats on:"
      />{' '}
      {interval > 1 ? (
        <TranslatedText
          stringId="outpatientAppointments.repeatAppointment.onNthWeekdayText"
          fallback="Every :interval :frequency"
          replacements={{
            interval: interval,
            frequency: getEnumTranslation(REPEAT_FREQUENCY_UNIT_PLURAL_LABELS, frequency),
          }}
        />
      ) : (
        <TranslatedEnum enumValues={REPEAT_FREQUENCY_LABELS} value={frequency} />
      )}{' '}
      {frequency === REPEAT_FREQUENCY.WEEKLY ? (
        <TranslatedText
          stringId="outpatientAppointments.repeatAppointment.onWeekdayText"
          fallback="on a :weekday"
          replacements={{
            weekday,
          }}
        />
      ) : (
        <TranslatedText
          stringId="outpatientAppointments.repeatAppointment.onNthWeekdayText"
          fallback="on the :nth :weekday"
          replacements={{ nth: getOrdinalText(weekdayInMonthIndex), weekday }}
        />
      )}
    </>
  );
};

export const RepeatingDateFields = ({ values, setFieldValue, handleResetUntilDate }) => {
  const { startTime, appointmentSchedule } = values;
  const { interval, frequency, occurrenceCount, untilDate } = appointmentSchedule;
  const startTimeDate = useMemo(() => parseISO(startTime), [startTime]);

  const [repeatType, setRepeatType] = useState(REPEAT_TYPES.ON);

  const handleChangeRepeatType = e => {
    const newValue = e.target.value;
    if (newValue === REPEAT_TYPES.ON) {
      handleResetUntilDate(startTimeDate, frequency, interval);
      setFieldValue('appointmentSchedule.occurrenceCount', null);
    } else {
      setFieldValue(
        'appointmentSchedule.occurrenceCount',
        repeatingAppointmentInitialValues.occurrenceCount,
      );
      setFieldValue('appointmentSchedule.untilDate', null);
    }
    setRepeatType(newValue);
  };

  const handleFrequencyChange = e => {
    const newValue = e.target.value;
    if (repeatType !== REPEAT_TYPES.ON) return;
    handleResetUntilDate(startTimeDate, newValue, interval);
  };

  return (
    <Container>
      <Box display="flex" gap="0.5rem" height="100%">
        <Field
          name="appointmentSchedule.interval"
          min={1}
          label={
            <TranslatedText
              stringId="outpatientAppointment.repeatAppointment.repeatEvery.label"
              fallback="Repeats every"
            />
          }
          component={StyledNumberField}
        />
        <Field
          placeholder=""
          name="appointmentSchedule.frequency"
          isClearable={false}
          enumValues={REPEAT_FREQUENCY_UNIT_LABELS}
          onChange={handleFrequencyChange}
          component={StyledTranslatedSelectField}
        />
      </Box>
      <Box>
        <SmallBodyText>
          <RepeatText startTimeDate={startTimeDate} frequency={frequency} interval={interval} />
        </SmallBodyText>
      </Box>
      <FormControl sx={{ m: 3 }} variant="standard">
        <StyledFormLabel id="ends-radio">
          <TranslatedText
            stringId="outpatientAppointment.repeatAppointment.ends.label"
            fallback="Ends"
          />
        </StyledFormLabel>
        <StyledRadioGroup
          aria-labelledby="ends-radio"
          value={repeatType}
          onChange={handleChangeRepeatType}
          name="repeats"
        >
          <Box display="flex" alignItems="center" gap="10px">
            <StyledFormControlLabel
              value={REPEAT_TYPES.ON}
              control={<StyledRadio />}
              label={
                <TranslatedText
                  stringId="outpatientAppointment.repeatAppointment.ends.option.on"
                  fallback="On"
                />
              }
            />
            <Field
              name="appointmentSchedule.untilDate"
              disabled={repeatType !== REPEAT_TYPES.ON}
              value={repeatType === REPEAT_TYPES.ON ? untilDate : ''}
              min={format(addSixFrequencyToDate(startTimeDate, frequency, interval), 'yyyy-MM-dd')}
              component={StyledDateField}
            />
          </Box>
          <Box display="flex" alignItems="center" gap="10px">
            <StyledFormControlLabel
              value={REPEAT_TYPES.AFTER}
              control={<StyledRadio />}
              label={
                <TranslatedText
                  stringId="outpatientAppointment.repeatAppointment.ends.option.after"
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
              value={repeatType === REPEAT_TYPES.AFTER ? occurrenceCount : ''}
              disabled={repeatType !== REPEAT_TYPES.AFTER}
              component={StyledNumberField}
            />
            <SmallBodyText color="textTertiary">
              <TranslatedText
                stringId="outpatientAppointment.repeatAppointment.occurrenceCount.label"
                fallback="occurrences"
              />
            </SmallBodyText>
          </Box>
        </StyledRadioGroup>
      </FormControl>
    </Container>
  );
};
