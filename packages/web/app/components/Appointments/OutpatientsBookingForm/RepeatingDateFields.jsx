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
    const sameDay = weeksInMonth.filter(day => day.getDay() === value.getDay());
    const nOfWeek = sameDay.findIndex(day => isSameDay(day, value));

    const getOrdinal = n => {
      if (sameDay.length === n + 1) {
        return <TranslatedText stringId="general.ordinalAdverbs.last" fallback="last" />;
      }
      return [
        <TranslatedText key="first" stringId="general.ordinalAdverbs.first" fallback="first" />,
        <TranslatedText key="second" stringId="general.ordinalAdverbs.second" fallback="second" />,
        <TranslatedText key="third" stringId="general.ordinalAdverbs.third" fallback="third" />,
        <TranslatedText key="forth" stringId="general.ordinalAdverbs.fourth" fallback="fourth" />,
      ][n];
    };

    return (
      <TranslatedText
        stringId="outpatientAppointments.repeatAppointment.onNthWeekdayText"
        fallback="on the :nth :weekday"
        replacements={{ nth: getOrdinal(nOfWeek), weekday: format(value, 'EEEE') }}
      />
    );
  }
};

export const RepeatingDateFields = ({ values, setFieldValue }) => {
  const [repeatType, setRepeatType] = useState(REPEAT_TYPES.ON);

  const { interval, frequency } = values.appointmentSchedule;

  const handleChangeFrequency = e => {
    setFieldValue(
      'appointmentSchedule.untilDate',
      addSixFrequencyToDate(parseISO(values.startTime), e.target.value),
    );
    setFieldValue('appointmentSchedule.frequency', e.target.value);
  };

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
          Repeats on: <TranslatedEnum enumValues={REPEAT_FREQUENCY_LABELS} value={frequency} />{' '}
          {getRepeatText(frequency, interval, parseISO(values.startTime))}
        </SmallBodyText>
      </Box>
      <FormControl sx={{ m: 3 }} variant="standard">
        <StyledFormLabel id="ends-radio">Ends</StyledFormLabel>
        <StyledRadioGroup
          aria-labelledby="ends-radio"
          value={repeatType}
          onChange={e => setRepeatType(e.target.value)}
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
