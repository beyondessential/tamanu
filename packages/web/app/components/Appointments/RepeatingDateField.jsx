import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Colors } from '../../constants';
import { DateInput, NumberInput, SelectInput } from '../Field';
import { TranslatedEnum, TranslatedText } from '../Translation';
import { upperFirst } from 'lodash';
import { SmallBodyText } from '../Typography';
import { REPEAT_INTERVAL_UNITS, REPEAT_INTERVAL_LABELS } from '@tamanu/constants';
import { addWeeks, format } from 'date-fns';
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

const StyledNumberInput = styled(NumberInput)`
  width: 117px;
  & .label-field {
    font-size: 12px;
  }
  & .MuiInputBase-input {
    font-size: 12px;
    padding-block: 10px;
    padding-inline: 13px 10px;
    &.Mui-disabled {
      background-color: ${Colors.background};
    }
  }
`;

const StyledSelectInput = styled(SelectInput)`
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

const StyledDateInput = styled(DateInput)`
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

const getRepeatText = (reportUnit, value) => {
  if (reportUnit === REPEAT_INTERVAL_UNITS.WEEK) {
    return `on a ${format(value, 'EEEE')}`;
  }
  if (reportUnit === REPEAT_INTERVAL_UNITS.MONTH) {
    const weekOfMonth = Math.ceil(value.getDate() / 7);
    return `on the ${['first', 'second', 'third', 'fourth', 'fifth'][weekOfMonth - 1]} ${format(
      value,
      'EEEE',
    )}`;
  }
};

export const RepeatingDateField = ({ value, onChange }) => {
  const [repeatN, setRepeatN] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState(REPEAT_INTERVAL_UNITS.WEEK);
  const [repeatType, setRepeatType] = useState('on');
  const [repeatDate, setRepeatDate] = useState(addWeeks(value, 6));
  const [repeatAfter, setRepeatAfter] = useState(2);

  return (
    <Container>
      <Box display="flex" gap="0.5rem" height="100%">
        <StyledNumberInput
          value={repeatN}
          min={0}
          onChange={e => setRepeatN(e.target.value)}
          label={
            <TranslatedText stringId="scheduling.repeatEvery.label" fallback="Repeats every" />
          }
        />
        <StyledSelectInput
          placeholder=""
          value={repeatUnit}
          isClearable={false}
          onChange={e => setRepeatUnit(e.target.value)}
          options={Object.values(REPEAT_INTERVAL_UNITS).map(unit => ({
            value: unit,
            label: upperFirst(unit),
          }))}
        />
      </Box>
      <Box>
        <SmallBodyText>
          Repeats on: <TranslatedEnum enumValues={REPEAT_INTERVAL_LABELS} value={repeatUnit} />{' '}
          {getRepeatText(repeatUnit, value)}
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
            <StyledDateInput
              value={repeatType === 'on' && repeatDate}
              onChange={e => setRepeatDate(e.target.value)}
              disabled={repeatType !== 'on'}
            />
          </Box>
          <Box display="flex" alignItems="center" gap="10px">
            <StyledFormControlLabel value="after" control={<StyledRadio />} label="After" />
            <StyledNumberInput
              sx={{
                width: '60px',
              }}
              value={repeatType === 'after' && repeatAfter}
              onChange={e => setRepeatAfter(e.target.value)}
              min={0}
              disabled={repeatType !== 'after'}
            />
            <SmallBodyText color="textTertiary">occurrences</SmallBodyText>
          </Box>
        </StyledRadioGroup>
      </FormControl>
    </Container>
  );
};
