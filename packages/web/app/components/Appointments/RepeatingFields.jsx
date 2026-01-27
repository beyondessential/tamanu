import { styled } from '@mui/material/styles';
import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import FormControlLabel, { formControlLabelClasses } from '@mui/material/FormControlLabel';
import Radio, { radioClasses } from '@mui/material/Radio';
import { typographyClasses } from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { add, parseISO } from 'date-fns';
import { toDateString } from '@tamanu/utils/dateTime';
import { useDateTimeFormat } from '@tamanu/ui-components';
import { get } from 'lodash';

import {
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_UNIT_LABELS,
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS,
} from '@tamanu/constants';
import { getWeekdayOrdinalPosition } from '@tamanu/utils/appointmentScheduling';

import { Colors } from '../../constants';
import { DateField, Field, NumberField, TranslatedSelectField } from '../Field';
import { TranslatedText } from '../Translation';
import { SmallBodyText } from '../Typography';
import { RepeatCharacteristicsDescription } from './OutpatientsBookingForm/RepeatCharacteristicsDescription';
import { ENDS_MODES } from '../../constants/locationAssignments';

const Container = styled('div')`
  width: 100%;
  background: ${({ readonly }) => (readonly ? Colors.background : Colors.white)};
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
    height: 18px;
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
      > div:first-of-type {
        height: 36px;
      }
    }
    width: 108px;
    margin-block-start: ${({ disabled }) => (disabled ? '20px' : '11px')};
    & .MuiInputBase-input {
      padding-block: ${({ disabled }) => (disabled ? '11.875px' : '11px')};
      padding-inline: 13px 10px;
      &.Mui-disabled {
        background-color: ${Colors.background};
      }
    }
  }
`;

const StyledRadio = styled(Radio)`
  &.${radioClasses.root} {
    color: ${Colors.outline};
    padding: 2px;
  }

  &.${radioClasses.checked} {
    color: ${Colors.primary};
    &.${radioClasses.disabled} {
      opacity: 30%;
    }
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
  margin-bottom: 10px;
  :focus {
    color: ${Colors.darkText};
  }
`;

const StyledRadioGroup = styled(RadioGroup)`
  gap: 10px;
`;

const DEFAULT_OCCURRENCE_COUNT = 2;

export const RepeatingFields = ({
  schedule,
  startTime,
  initialValues,
  setFieldValue,
  setFieldError,
  handleResetRepeatUntilDate,
  readonly,
  maxFutureMonths,
}) => {
  const { getFacilityCurrentDateString } = useDateTimeFormat();
  const { occurrenceCount: initialOccurrenceCount } = initialValues?.schedule || {};
  const { interval, frequency, occurrenceCount, untilDate } = schedule;
  const [endsMode, setEndsMode] = useState(schedule.untilDate ? ENDS_MODES.ON : ENDS_MODES.AFTER);
  const startTimeDate = useMemo(() => startTime && parseISO(startTime), [startTime]);

  const handleChangeEndsMode = e => {
    const newModeValue = e.target.value;
    if (newModeValue === ENDS_MODES.ON) {
      handleResetRepeatUntilDate(startTimeDate);
      setFieldValue('schedule.occurrenceCount', null);
      setFieldError('schedule.occurrenceCount', null);
    } else if (newModeValue === ENDS_MODES.AFTER) {
      setFieldValue('schedule.occurrenceCount', initialOccurrenceCount || DEFAULT_OCCURRENCE_COUNT);
      setFieldValue('schedule.untilDate', null);
      setFieldError('schedule.untilDate', null);
    }
    setEndsMode(newModeValue);
  };

  const handleFrequencyChange = e => {
    if (e.target.value === REPEAT_FREQUENCY.MONTHLY) {
      setFieldValue('schedule.nthWeekday', getWeekdayOrdinalPosition(startTimeDate));
    } else if (e.target.value === REPEAT_FREQUENCY.WEEKLY) {
      setFieldValue('schedule.nthWeekday', null);
    }
  };

  const validateKeyboardEnteredNumber = (name, min = 1, max = 99) => {
    const inputValue = get(schedule, name);
    if (inputValue > max) {
      setFieldValue(`schedule.${name}`, max);
    } else if (inputValue < min || inputValue === '') {
      setFieldValue(`schedule.${name}`, min);
    }
  };

  return (
    <Container readonly={readonly} data-testid="container-oyny">
      <Box display="flex" gap="0.5rem" height="100%" data-testid="box-7p2r">
        <Field
          name="schedule.interval"
          min={1}
          max={99}
          disabled={readonly}
          onBlur={() => validateKeyboardEnteredNumber('interval')}
          label={
            <TranslatedText
              stringId="outpatientAppointment.repeating.repeatEvery.label"
              fallback="Repeats every"
              data-testid="translatedtext-66j4"
            />
          }
          component={StyledNumberField}
          data-testid="field-4pka"
        />
        <Field
          placeholder=""
          name="schedule.frequency"
          disabled={readonly}
          isClearable={false}
          enumValues={
            interval === 1 ? REPEAT_FREQUENCY_UNIT_LABELS : REPEAT_FREQUENCY_UNIT_PLURAL_LABELS
          }
          TranslatedTextProps={{ casing: 'sentence' }}
          onChange={handleFrequencyChange}
          component={StyledTranslatedSelectField}
          data-testid="field-rviq"
        />
      </Box>
      <Box data-testid="box-8tzl">
        <SmallBodyText data-testid="smallbodytext-d2yg">
          <RepeatCharacteristicsDescription
            startTimeDate={startTimeDate}
            frequency={frequency}
            interval={interval}
            data-testid="repeatcharacteristicsdescription-trx2"
          />
        </SmallBodyText>
      </Box>
      <FormControl variant="standard" data-testid="formcontrol-0213">
        <StyledFormLabel id="ends-radio" data-testid="styledformlabel-tyub">
          <TranslatedText
            stringId="outpatientAppointment.repeating.ends.label"
            fallback="Ends"
            data-testid="translatedtext-35ss"
          />
        </StyledFormLabel>
        <StyledRadioGroup
          aria-labelledby="ends-radio"
          onChange={handleChangeEndsMode}
          value={endsMode}
          data-testid="styledradiogroup-e80y"
        >
          <Box display="flex" alignItems="center" gap="10px" data-testid="box-cyxy">
            <StyledFormControlLabel
              value={ENDS_MODES.ON}
              control={<StyledRadio disabled={readonly} data-testid="styledradio-4bdi" />}
              label={
                <TranslatedText
                  stringId="outpatientAppointment.repeating.ends.option.on"
                  fallback="On"
                  data-testid="translatedtext-8k67"
                />
              }
              data-testid="styledformcontrollabel-hndm"
            />
            <Field
              name="schedule.untilDate"
              disabled={readonly || endsMode !== ENDS_MODES.ON}
              value={endsMode === ENDS_MODES.ON ? untilDate : ''}
              min={toDateString(
                add(startTimeDate, {
                  [`${REPEAT_FREQUENCY_UNIT_PLURAL_LABELS[frequency]}`]: interval,
                }),
              )}
              max={
                maxFutureMonths
                  ? toDateString(add(parseISO(getFacilityCurrentDateString()), { months: maxFutureMonths }))
                  : undefined
              }
              component={StyledDateField}
              data-testid="field-4flf"
            />
          </Box>
          <Box display="flex" alignItems="center" gap="10px" data-testid="box-824a">
            <StyledFormControlLabel
              value={ENDS_MODES.AFTER}
              control={<StyledRadio disabled={readonly} data-testid="styledradio-d7qf" />}
              label={
                <TranslatedText
                  stringId="outpatientAppointment.repeating.ends.option.after"
                  fallback="After"
                  data-testid="translatedtext-3s0p"
                />
              }
              data-testid="styledformcontrollabel-rdlk"
            />
            <Field
              name="schedule.occurrenceCount"
              sx={{
                width: '60px',
              }}
              min={DEFAULT_OCCURRENCE_COUNT}
              max={99}
              onBlur={() =>
                validateKeyboardEnteredNumber('occurrenceCount', DEFAULT_OCCURRENCE_COUNT)
              }
              value={endsMode === ENDS_MODES.AFTER ? occurrenceCount : ''}
              disabled={readonly || endsMode !== ENDS_MODES.AFTER}
              component={StyledNumberField}
              data-testid="field-i9q9"
            />
            <SmallBodyText color="textTertiary" data-testid="smallbodytext-ko4f">
              <TranslatedText
                stringId="outpatientAppointment.repeating.occurrenceCount.label"
                fallback="occurrences"
                data-testid="translatedtext-1pqb"
              />
            </SmallBodyText>
          </Box>
        </StyledRadioGroup>
      </FormControl>
    </Container>
  );
};
