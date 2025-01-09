import { styled } from '@mui/material/styles';
import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import FormControlLabel, { formControlLabelClasses } from '@mui/material/FormControlLabel';
import Radio, { radioClasses } from '@mui/material/Radio';
import { typographyClasses } from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { format, add, parseISO } from 'date-fns';
import { get } from 'lodash';

import {
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_UNIT_LABELS,
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS,
} from '@tamanu/constants';
import { getWeekdayOrdinalPosition } from '@tamanu/utils/appointmentScheduling';

import { Colors } from '../../../constants';
import { DateField, Field, NumberField, TranslatedSelectField } from '../../Field';
import { TranslatedText } from '../../Translation';
import { SmallBodyText } from '../../Typography';
import { RepeatCharacteristicsDescription } from './RepeatCharacteristicsDescription';

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
  & .Mui-disabled {
    background-color: ${Colors.background};
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
  color: ${Colors.darkText};
  :focus {
    color: ${Colors.darkText};
  }
`;

const StyledRadioGroup = styled(RadioGroup)`
  gap: 10px;
`;

const DEFAULT_OCCURRENCE_COUNT = 2;

export const ENDS_MODES = {
  ON: 'on',
  AFTER: 'after',
};

export const RepeatingAppointmentFields = ({
  values,
  setFieldValue,
  setFieldError,
  handleResetRepeatUntilDate,
}) => {
  const { startTime, appointmentSchedule } = values;
  const { interval, frequency, occurrenceCount, untilDate, endsMode } = appointmentSchedule;
  const startTimeDate = useMemo(() => parseISO(startTime), [startTime]);

  const handleChangeEndsMode = e => {
    const newModeValue = e.target.value;
    if (newModeValue === ENDS_MODES.ON) {
      handleResetRepeatUntilDate(startTimeDate);
      setFieldValue('appointmentSchedule.occurrenceCount', null);
      setFieldError('appointmentSchedule.occurrenceCount', null);
    } else if (newModeValue === ENDS_MODES.AFTER) {
      setFieldValue('appointmentSchedule.occurrenceCount', DEFAULT_OCCURRENCE_COUNT);
      setFieldValue('appointmentSchedule.untilDate', null);
      setFieldError('appointmentSchedule.untilDate', null);
    }
    setFieldValue('appointmentSchedule.endsMode', newModeValue);
  };

  const handleFrequencyChange = e => {
    if (e.target.value === REPEAT_FREQUENCY.MONTHLY) {
      setFieldValue('appointmentSchedule.nthWeekday', getWeekdayOrdinalPosition(startTimeDate));
    } else if (e.target.value === REPEAT_FREQUENCY.WEEKLY) {
      setFieldValue('appointmentSchedule.nthWeekday', null);
    }
  };

  const validateKeyboardEnteredNumber = (name, min = 1, max = 99) => {
    const inputValue = get(values, name);
    if (inputValue > max) {
      setFieldValue(name, max);
    } else if (inputValue < min || inputValue === '') {
      setFieldValue(name, min);
    }
  };

  return (
    <Container>
      <Box display="flex" gap="0.5rem" height="100%">
        <Field
          name="appointmentSchedule.interval"
          min={1}
          max={99}
          onBlur={() => validateKeyboardEnteredNumber('appointmentSchedule.interval')}
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
          TranslatedTextProps={{ upperFirst: true }}
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
          name="appointmentSchedule.endsMode"
          aria-labelledby="ends-radio"
          onChange={handleChangeEndsMode}
          value={endsMode}
        >
          <Box display="flex" alignItems="center" gap="10px">
            <StyledFormControlLabel
              value={ENDS_MODES.ON}
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
              disabled={endsMode !== ENDS_MODES.ON}
              value={endsMode === ENDS_MODES.ON ? untilDate : ''}
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
              value={ENDS_MODES.AFTER}
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
              min={DEFAULT_OCCURRENCE_COUNT}
              max={99}
              onBlur={() =>
                validateKeyboardEnteredNumber(
                  'appointmentSchedule.occurrenceCount',
                  DEFAULT_OCCURRENCE_COUNT,
                )
              }
              value={endsMode === ENDS_MODES.AFTER ? occurrenceCount : ''}
              disabled={endsMode !== ENDS_MODES.AFTER}
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
