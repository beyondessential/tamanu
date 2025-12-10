import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import { Box } from '@material-ui/core';
import { addDays, isAfter, isBefore, parse } from 'date-fns';
import { format as formatDate, toDateString, toDateTimeString } from '@tamanu/utils/dateTime';
import { TextInput } from './TextField';
import { TAMANU_COLORS } from '../../constants';
import { DefaultIconButton } from '../Button';

// This component is pretty tricky! It has to keep track of two layers of state:
//
//  - actual date, received from `value` and emitted through `onChange`
//    this is always in RFC3339 format (which looks like "1996-12-19T16:39:57")
//
//  - currently entered date, which might be only partially entered
//    this is a string in whatever format that has been given to the
//    component through the `format` prop.
//
// As the string formats don't contain timezone information, the RFC3339 dates are
// always in UTC - leaving it up to the local timezone can introduce some wacky
// behaviour as the dates get converted back and forth.
//
// Care has to be taken with setting the string value, as the native date control
// has some unusual input handling (switching focus between day/month/year etc) that
// a value change will interfere with.

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
  ['data-testid']: dataTestId,
  ...props
}) => {
  delete props.placeholder;

  const [currentText, setCurrentText] = useState(fromRFC3339(value, format));
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
      const date = parse(formattedValue, format, new Date());

      let outputValue;
      if (saveDateAsString) {
        if (type === 'date') {
          outputValue = toDateString(date);
        } else if (['time', 'datetime-local'].includes(type)) {
          outputValue = toDateTimeString(date);
        }
      } else {
        outputValue = date.toISOString();
      }
      setIsPlaceholder(false);
      setCurrentText(formattedValue);
      if (outputValue === 'Invalid date') {
        clearValue();
        return;
      }

      onChange({ target: { value: outputValue, name } });
    },
    [onChange, format, name, saveDateAsString, type, clearValue],
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
    const newDate = formatDate(addDays(date, addDaysAmount), format);

    onValueChange({ target: { value: newDate } });
  };

  const handleBlur = e => {
    // if the final input is invalid, clear the component value
    if (!e.target.value) {
      clearValue();
      setCurrentText('');
      return;
    }

    const date = parse(currentText, format, new Date());

    if (max && !keepIncorrectValue) {
      const maxDate = parse(max, format, new Date());
      if (isAfter(date, maxDate)) {
        clearValue();
        return;
      }
    }

    if (min && !keepIncorrectValue) {
      const minDate = parse(min, format, new Date());
      if (isBefore(date, minDate)) {
        clearValue();
        return;
      }
    }
  };

  useEffect(() => {
    const formattedValue = fromRFC3339(value, format);
    if (value && formattedValue) {
      setCurrentText(formattedValue);
      setIsPlaceholder(false);
    }
    return () => {
      setCurrentText('');
      setIsPlaceholder(true);
    };
  }, [value, format]);

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
        inputProps: { max, min, ...inputProps },
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

export const DateTimeInput = props => (
  <DateInput type="datetime-local" format="yyyy-MM-dd'T'HH:mm" max="9999-12-31T00:00" {...props} />
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
