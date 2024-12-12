import { styled } from '@mui/material/styles';
import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import FormControlLabel, { formControlLabelClasses } from '@mui/material/FormControlLabel';
import Radio, { radioClasses } from '@mui/material/Radio';
import { typographyClasses } from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { format, add, parseISO } from 'date-fns';

import {
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_UNIT_LABELS,
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS,
} from '@tamanu/constants';

import { Colors } from '../../../constants';
import { DateField, Field, NumberField, TranslatedSelectField } from '../../Field';
import { TranslatedText } from '../../Translation';
import { SmallBodyText } from '../../Typography';
import {
  getNthWeekday,
  RepeatCharacteristicsDescription,
} from './RepeatCharacteristicsDescription';

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

const DEFAULT_OCCURRENCE_COUNT = 2;

const END_MODES = {
  ON: 'on',
  AFTER: 'after',
};

export const RepeatingDateFields = ({ values, setFieldValue, handleResetUntilDate }) => {
  const { startTime, appointmentSchedule } = values;
  const { interval, frequency, occurrenceCount, untilDate } = appointmentSchedule;
  const [endsMode, setEndsMode] = useState(END_MODES.ON);
  const startTimeDate = useMemo(() => parseISO(startTime), [startTime]);

  const handleChangeEndsMode = e => {
    const newValue = e.target.value;
    if (newValue === END_MODES.ON) {
      handleResetUntilDate(startTimeDate);
      setFieldValue('appointmentSchedule.occurrenceCount', null);
    } else if (newValue === END_MODES.AFTER) {
      setFieldValue('appointmentSchedule.occurrenceCount', DEFAULT_OCCURRENCE_COUNT);
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
          <RepeatCharacteristicsDescription
            startTimeDate={startTimeDate}
            frequency={frequency}
            interval={interval}
          />
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
