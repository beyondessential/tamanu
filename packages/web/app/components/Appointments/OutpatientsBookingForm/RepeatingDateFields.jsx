import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Colors } from '../../../constants';
import { DateField, Field, NumberField, SelectField } from '../../Field';
import { TranslatedEnum, TranslatedText } from '../../Translation';
import { upperFirst } from 'lodash';
import { SmallBodyText } from '../../Typography';
import {
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_LABELS,
  REPEAT_FREQUENCY_UNIT_LABELS,
} from '@tamanu/constants';
import { format, add, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { FormControl, FormLabel } from '@material-ui/core';
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

// TODO: translated everything
const getRepeatText = (reportUnit, repeatN, value) => {
  if (reportUnit === REPEAT_FREQUENCY.WEEKLY) {
    return `on a ${format(value, 'EEEE')}`;
  }
  if (reportUnit === REPEAT_FREQUENCY.MONTHLY) {
    let text = `on the `;
    const weeksInMonth = eachDayOfInterval({
      start: startOfMonth(value),
      end: endOfMonth(value, 1),
    });
    const sameDay = weeksInMonth.filter(day => day.getDay() === value.getDay());
    const nOfWeek = sameDay.findIndex(day => isSameDay(day, value));
    if (sameDay.length === nOfWeek + 1) {
      text += 'last';
    } else {
      text += ['first', 'second', 'third', 'fourth'][nOfWeek];
    }

    return `${text} ${format(value, 'EEEE')}`;
  }
};

export const RepeatingDateFields = ({ values }) => {
  const [repeatType, setRepeatType] = useState('on');

  const { interval, frequency } = values.appointmentSchedule;

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
          component={StyledSelectField}
        />
      </Box>
      <Box>
        <SmallBodyText>
          Repeats on: <TranslatedEnum enumValues={REPEAT_FREQUENCY_LABELS} value={frequency} />{' '}
          {getRepeatText(frequency, interval, value)}
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
            <StyledFormControlLabel value="on" control={<StyledRadio />} label="On" />
            <Field
              name="appointmentSchedule.untilDate"
              disabled={repeatType !== 'on'}
              min={format(
                add(values.startTime, {
                  [`${REPEAT_FREQUENCY_UNIT_LABELS[frequency]}s`]: values.interval,
                }),
                'yyyy-MM-dd',
              )}
              component={StyledDateField}
            />
          </Box>
          <Box display="flex" alignItems="center" gap="10px">
            <StyledFormControlLabel value="after" control={<StyledRadio />} label="After" />
            <Field
              name="appointmentSchedule.occurrenceCount"
              sx={{
                width: '60px',
              }}
              min={0}
              disabled={repeatType !== 'after'}
              component={StyledNumberField}
            />
            <SmallBodyText color="textTertiary">occurrences</SmallBodyText>
          </Box>
        </StyledRadioGroup>
      </FormControl>
    </Container>
  );
};
