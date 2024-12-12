import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
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
import { upperFirst } from 'lodash';

import {
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_LABELS,
  REPEAT_FREQUENCY_UNIT_LABELS,
} from '@tamanu/constants';

import { Colors } from '../../../constants';
import { DateField, Field, NumberField, SelectField } from '../../Field';
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

const StyledSelectField = styled(SelectField)`
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

const REPEAT_TYPES = {
  ON: 'on',
  AFTER: 'after',
};

const addSixFrequencyToDate = (date, frequency) =>
  add(date, { [`${REPEAT_FREQUENCY_UNIT_LABELS[frequency]}s`]: 6 });

// TODO: translated everything
const getRepeatText = (reportUnit, repeatN, value) => {
  if (reportUnit === REPEAT_FREQUENCY.WEEKLY) {
    return (
      <TranslatedText
        stringId="outpatientAppointments.repeatAppointment.onWeekdayText"
        fallback="on a :weekday"
        replacements={{
          weekday: format(value, 'EEEE'),
        }}
      />
    );
  }
  if (reportUnit === REPEAT_FREQUENCY.MONTHLY) {
    const weeksInMonth = eachDayOfInterval({
      start: startOfMonth(value),
      end: endOfMonth(value, 1),
    });
    const weekdayMatchesInMonth = weeksInMonth.filter(day => day.getDay() === value.getDay());
    const weekdayInMonthIndex = weekdayMatchesInMonth.findIndex(day => isSameDay(day, value));

    const getOrdinal = n => {
      if (weekdayMatchesInMonth.length === n + 1) {
        return <TranslatedText stringId="general.ordinals.last" fallback="last" />;
      }
      return [
        <TranslatedText key="first" stringId="general.ordinals.first" fallback="first" />,
        <TranslatedText key="second" stringId="general.ordinals.second" fallback="second" />,
        <TranslatedText key="third" stringId="general.ordinals.third" fallback="third" />,
        <TranslatedText key="forth" stringId="general.ordinals.fourth" fallback="fourth" />,
      ][n];
    };

    return (
      <TranslatedText
        stringId="outpatientAppointments.repeatAppointment.onNthWeekdayText"
        fallback="on the :nth :weekday"
        replacements={{ nth: getOrdinal(weekdayInMonthIndex), weekday: format(value, 'EEEE') }}
      />
    );
  }
};

export const RepeatingDateFields = ({ values, setFieldValue }) => {
  const { getTranslation } = useTranslation();
  const [repeatType, setRepeatType] = useState(REPEAT_TYPES.ON);

  const { interval, frequency, occurrenceCount, untilDate } = values.appointmentSchedule;

  const formatOrdinals = n => {
    const pr = new Intl.PluralRules('default', { type: 'ordinal' });
    const suffixes = new Map([
      ['one', getTranslation('general.ordinals.suffix.one', 'st')],
      ['two', getTranslation('general.ordinals.suffix.two', 'nd')],
      ['few', getTranslation('general.ordinals.suffix.few', 'rd')],
      ['other', getTranslation('general.ordinals.suffix.other', 'th')],
    ]);
    const rule = pr.select(n);
    const suffix = suffixes.get(rule);
    return `${n}${suffix}`;
  };

  const handleChangeFrequency = e => {
    setFieldValue(
      'appointmentSchedule.untilDate',
      addSixFrequencyToDate(parseISO(values.startTime), e.target.value),
    );
    setFieldValue('appointmentSchedule.frequency', e.target.value);
  };

  const handleChangeRepeatType = e => {
    if (e.target.value === REPEAT_TYPES.ON) {
      setFieldValue(
        'appointmentSchedule.untilDate',
        addSixFrequencyToDate(parseISO(values.startTime), frequency),
      );
      setFieldValue('appointmentSchedule.occurrenceCount', null);
    } else {
      setFieldValue('appointmentSchedule.untilDate', null);
      setFieldValue('appointmentSchedule.occurrenceCount', 2);
    }
    setRepeatType(e.target.value);
  };

  console.log(values);
  return (
    <Container>
      <Box display="flex" gap="0.5rem" height="100%">
        <Field
          name="appointmentSchedule.interval"
          min={1}
          label={
            <TranslatedText stringId="scheduling.repeatEvery.label" fallback="Repeats every" />
          }
          component={StyledNumberField}
        />
        <Field
          placeholder=""
          name="appointmentSchedule.frequency"
          isClearable={false}
          options={Object.entries(REPEAT_FREQUENCY_UNIT_LABELS).map(([key, value]) => ({
            value: key,
            label: upperFirst(value),
          }))}
          onChange={handleChangeFrequency}
          component={StyledSelectField}
        />
      </Box>
      <Box>
        <SmallBodyText>
          <TranslatedText
            stringId="outpatientAppointment.repeatAppointment.repeatsOnText"
            fallback="Repeats on:"
          />{' '}
          {interval > 1 ? (
            <>
              <TranslatedText
                stringId="general.every"
                fallback="Every :interval"
                replacements={{
                  interval: formatOrdinals(interval),
                }}
              />
              <TranslatedEnum enumValues={REPEAT_FREQUENCY_UNIT_LABELS} value={frequency} />
            </>
          ) : (
            <TranslatedEnum enumValues={REPEAT_FREQUENCY_LABELS} value={frequency} />
          )}{' '}
          {getRepeatText(frequency, interval, parseISO(values.startTime))}
        </SmallBodyText>
      </Box>
      <FormControl sx={{ m: 3 }} variant="standard">
        <StyledFormLabel id="ends-radio">Ends</StyledFormLabel>
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
                  stringId="outpatientAppointment.repeatAppointment.on.label"
                  fallback="On"
                />
              }
            />
            <Field
              name="appointmentSchedule.untilDate"
              disabled={repeatType !== REPEAT_TYPES.ON}
              value={repeatType === REPEAT_TYPES.ON ? untilDate : ''}
              min={format(
                addSixFrequencyToDate(parseISO(values.startTime), frequency),
                'yyyy-MM-dd',
              )}
              component={StyledDateField}
            />
          </Box>
          <Box display="flex" alignItems="center" gap="10px">
            <StyledFormControlLabel
              value={REPEAT_TYPES.AFTER}
              control={<StyledRadio />}
              label={
                <TranslatedText
                  stringId="outpatientAppointment.repeatAppointment.after.label"
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
            <SmallBodyText color="textTertiary">occurrences</SmallBodyText>
          </Box>
        </StyledRadioGroup>
      </FormControl>
    </Container>
  );
};
