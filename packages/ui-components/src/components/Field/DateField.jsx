import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import { Box } from '@material-ui/core';
import { addDays, isAfter, isBefore, parse } from 'date-fns';

import { format as formatDate, toDateString, toDateTimeString } from '@tamanu/utils/dateTime';

import { DefaultIconButton } from '../Button';
import { TextInput } from './TextField';
import { TAMANU_COLORS } from '../../constants';
import { useDateTimeIfAvailable } from '../../contexts';

/*
 * DateInput handles two layers of state:
 *
 * 1. Form value (`value` / `onChange`): ISO9075 format in countryTimeZone (persisted to DB)
 * 2. Display value: facilityTimeZone when useTimezone=true, otherwise as-is
 *
 * Timezone flow (useTimezone=true):
 *    Load: countryTimeZone → toFacilityDateTime → facilityTimeZone
 *    Save: facilityTimeZone → toStoredDateTime → countryTimeZone
 *
 * Note: Native datetime inputs have quirky focus handling between day/month/year segments,
 * so avoid unnecessary value updates that could interfere with user input.
 */

// Here I have made a data URL for the new calendar icon. The existing calendar icon was a pseudo element
// in the user agent shadow DOM. In order to add a new icon I had to make the pseudo element invisible
// a new icon I had to make the pseudo element invisible and render a replacement on top using svg data url.
const CustomIconTextInput = styled(TextInput)`
  input::-webkit-calendar-picker-indicator {
    color: rgba(0, 0, 0, 0);
    opacity: 1;
    background-image: url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg' %3E%3Cpath d='M13.125 1.75H11.375V0H8.75V1.75H5.25V0H2.625V1.75H0.875C0.392 1.75 0 2.142 0 2.625V13.125C0 13.608 0.392 14 0.875 14H13.125C13.608 14 14 13.608 14 13.125V2.625C14 2.142 13.608 1.75 13.125 1.75ZM12.25 12.25H1.75V6.125H12.25V12.25Z' fill='%23326699' /%3E%3C/svg%3E");
    cursor: pointer;
    border-radius: 50%;
    margin-left: 0.5rem;
  }
`;

function fromRFC3339(rfc3339Date, format) {
  if (!rfc3339Date) return '';
  return formatDate(rfc3339Date, format);
}

export const DateInput = ({
  type = 'date',
  value,
  format = 'yyyy-MM-dd',
  onChange,
  name,
  max = '9999-12-31',
  min,
  saveDateAsString = false,
  arrows = false,
  inputProps = {},
  keepIncorrectValue,
  useTimezone = false,
  ['data-testid']: dataTestId,
  ...props
}) => {
  delete props.placeholder;

  const dateTime = useDateTimeIfAvailable();
  const shouldUseTimezone = useTimezone && type === 'datetime-local' && dateTime != null;
  const { toFacilityDateTime, toStoredDateTime } = dateTime ?? {};

  // Normalize max/min to datetime-local format (T-separated) when using timezones
  const normalizedMax = shouldUseTimezone ? toFacilityDateTime(max) : max;
  const normalizedMin = shouldUseTimezone ? toFacilityDateTime(min) : min;

  // Convert stored value (countryTimeZone) to display value (facilityTimeZone for datetime-local)
  const getDisplayValue = val => {
    if (shouldUseTimezone) return toFacilityDateTime(val) || '';
    return fromRFC3339(val, format);
  };

  const [currentText, setCurrentText] = useState(getDisplayValue(value));
  const [isPlaceholder, setIsPlaceholder] = useState(!value);

  // Weird thing alert:
  // If the value is cleared, we need to remount the component to reset the input field
  // because the html date input doesn't know the difference between an empty string and an invalid
  // date, so if the value is cleared while the user has partially typed a date, the input will
  // still show the partially typed date
  const [isRemounting, setIsRemounting] = useState(false);
  const clearValue = useCallback(() => {
    onChange({ target: { value: '', name } });
    setIsRemounting(true);
    setTimeout(() => setIsRemounting(false), 0);
    setIsPlaceholder(true);
  }, [onChange, name]);

  const onValueChange = useCallback(
    event => {
      if (event.target.validity?.badInput) {
        // if the user starts editing the field by typing e.g. a '0' in the month field, until they
        // type another digit the resulting string is an invalid date
        // in this case we don't want to save the value to the form, as it would clear the whole
        // field and interrupt their edit
        // instead, simply return early, which will mean the last valid date will be kept
        // (conveniently, this is also what the html date input will display)
        // however, we -do- still want to change the text colour from the placeholder colour
        return;
      }

      const formattedValue = event.target.value;
      if (!formattedValue) {
        clearValue();
        return;
      }

      let outputValue;

      if (shouldUseTimezone) {
        // Convert input value (facilityTimeZone) to storage value (countryTimeZone)
        outputValue = toStoredDateTime(formattedValue);
      } else {
        const date = parse(formattedValue, format, new Date());

        if (saveDateAsString) {
          if (type === 'date') {
            outputValue = toDateString(date);
          } else if (['time', 'datetime-local'].includes(type)) {
            outputValue = toDateTimeString(date);
          }
        } else {
          outputValue = date.toISOString();
        }
      }

      setIsPlaceholder(false);
      setCurrentText(formattedValue);
      if (outputValue === 'Invalid date' || outputValue === null) {
        clearValue();
        return;
      }

      onChange({ target: { value: outputValue, name } });
    },
    [
      onChange,
      format,
      name,
      saveDateAsString,
      type,
      clearValue,
      shouldUseTimezone,
      toStoredDateTime,
    ],
  );

  const onKeyDown = event => {
    if (event.key === 'Backspace') {
      clearValue();
    }
    // if the user has started typing a date, turn off placeholder styling
    if (event.key.length === 1 && isPlaceholder) {
      setIsPlaceholder(false);
    }
  };

  const onArrowChange = addDaysAmount => {
    const date = parse(currentText, format, new Date());
    const newValue = formatDate(addDays(date, addDaysAmount), format);
    onValueChange({ target: { value: newValue } });
  };

  const handleBlur = e => {
      // if the final input is invalid, clear the component value
    if (!e.target.value) {
      clearValue();
      setCurrentText('');
      return;
    }
    if (keepIncorrectValue) return;

    const inputValue = e.target.value;
    const outOfBounds = shouldUseTimezone
      ? (normalizedMax && inputValue > normalizedMax) ||
        (normalizedMin && inputValue < normalizedMin)
      : (max && isAfter(parse(inputValue, format, new Date()), parse(max, format, new Date()))) ||
        (min && isBefore(parse(inputValue, format, new Date()), parse(min, format, new Date())));

    if (outOfBounds) clearValue();
  };

  useEffect(() => {
    const formattedValue = getDisplayValue(value);
    if (value && formattedValue) {
      setCurrentText(formattedValue);
      setIsPlaceholder(false);
    }
    return () => {
      setCurrentText('');
      setIsPlaceholder(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, format, shouldUseTimezone, toFacilityDateTime]);

  // We create two copies of the DateField component, so that we can have a temporary one visible
  // during remount (for more on that, see the remounting description at the top of this component)
  const normalDateField = (
    <CustomIconTextInput
      type={type}
      value={currentText}
      onChange={onValueChange}
      onKeyDown={onKeyDown}
      onBlur={handleBlur}
      InputProps={{
        // Set max property on HTML input element to force 4-digit year value (max year being 9999)
        inputProps: { max: normalizedMax, min: normalizedMin, ...inputProps },
        'data-testid': `${dataTestId}-input`,
      }}
      style={isPlaceholder ? { color: TAMANU_COLORS.softText } : undefined}
      data-testid={dataTestId}
      {...props}
    />
  );

  const remountingDateField = (
    <CustomIconTextInput
      key="remounting"
      type={type}
      InputProps={{
        inputProps,
      }}
      style={{ color: TAMANU_COLORS.softText }}
      data-testid={dataTestId}
      {...props}
    />
  );

  const activeDateField = isRemounting ? remountingDateField : normalDateField;

  const ContainerWithArrows = ({ children }) => (
    <Box display="flex" alignContent="center" data-testid="box-13xp">
      <DefaultIconButton onClick={() => onArrowChange(-1)} data-testid="defaulticonbutton-1fiy">
        <KeyboardArrowLeftIcon data-testid="keyboardarrowlefticon-fn4i" />
      </DefaultIconButton>
      {children}
      <DefaultIconButton onClick={() => onArrowChange(1)} data-testid="defaulticonbutton-rmeh">
        <KeyboardArrowRightIcon data-testid="keyboardarrowrighticon-9tyl" />
      </DefaultIconButton>
    </Box>
  );

  return arrows ? (
    <ContainerWithArrows data-testid="containerwitharrows-nuzt">
      {activeDateField}
    </ContainerWithArrows>
  ) : (
    activeDateField
  );
};

export const TimeInput = props => <DateInput type="time" format="HH:mm" {...props} />;

export const DateTimeInput = ({ useTimezone = true, ...props }) => (
  <DateInput
    type="datetime-local"
    format="yyyy-MM-dd'T'HH:mm"
    max="9999-12-31T00:00"
    useTimezone={useTimezone}
    {...props}
  />
);

export const DateField = ({ field, ...props }) => (
  <DateInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);

export const TimeField = ({ field, ...props }) => (
  <TimeInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);

export const DateTimeField = ({ field, ...props }) => (
  <DateTimeInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
