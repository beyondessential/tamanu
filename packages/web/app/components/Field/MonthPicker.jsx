import Popper from '@mui/material/Popper';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { add, endOfYear, isValid, parse, startOfDay, startOfYear } from 'date-fns';
import React, { useState } from 'react';
import styled from 'styled-components';

import { useDateTime } from '@tamanu/ui-components';

import { Colors } from '../../constants';
import { ExpandLessIcon, ExpandMoreIcon } from './FieldCommonComponents';
import { TextInput } from './TextField';

const StyledPopper = styled(Popper)`
  font-size: 0.875rem;
  line-height: 1.35;
  font-variant-numeric: lining-nums tabular-nums;
  z-index: 20;

  .MuiPaper-root {
    border: max(0.0625rem, 1px) solid ${Colors.outline};
    box-shadow: none;
  }

  .MuiPickersCalendarHeader-root {
    margin-block: 0;
  }

  .MuiPickersCalendarHeader-labelContainer {
    font-size: inherit;
  }

  .MuiDateCalendar-root {
    block-size: auto;
    margin-block: 0.75rem;
    padding-inline: 0.625rem;
  }

  .MuiPickersSlideTransition-root {
    min-block-size: 0;
  }

  .MuiDayCalendar-monthContainer {
    position: unset;
  }

  .MuiMonthCalendar-root,
  .MuiYearCalendar-root {
    overflow-y: auto;
    padding-inline: 0;
    row-gap: 0.5rem;
    inline-size: fit-content;
  }

  .MuiPickersYear-yearButton,
  .MuiPickersMonth-monthButton {
    block-size: fit-content;
    color: ${Colors.darkestText};
    font-size: inherit;
    font-weight: 500;
    inline-size: 4.5em;
    line-height: 1.5;
    margin-block: 0;
    padding-block: 0.25rem;
    padding-inline: 0.5rem;
    transition: background-color 120ms ease;
  }

  .Mui-selected {
    background-color: ${Colors.primary};
    color: white;

    &:hover,
    &:focus-visible {
      background-color: ${Colors.primary};
    }
  }

  .MuiPickersCalendarHeader-root {
    padding-inline: 1rem;
  }

  .MuiPickersCalendarHeader-labelContainer {
  }
`;

const StyledDatePicker = styled(DatePicker).attrs({
  format: 'MMM yyyy',
  views: ['month', 'year'],
})`
  .MuiInputBase-root {
    padding-inline-end: 0;
  }

  .MuiInputBase-input {
    padding-block: 0.5rem;
    padding-inline: 0.5rem 0.25rem;
  }

  .MuiInputAdornment-root {
    margin-inline-start: 0;
  }

  .MuiInputAdornment-root .MuiIconButton-root {
    aspect-ratio: 1;
    margin-inline-end: 0;
    padding: 0.375rem;

    > svg {
      margin: 0;
    }
  }
`;

export const MonthPicker = ({ defaultValue, minDate, maxDate, value, onChange, ...props }) => {
  const { getFacilityNowDate } = useDateTime();
  const [open, setOpen] = useState(false);
  const facilityNow = getFacilityNowDate();

  const handleMonthChange = (monthString) => {
    const parsedDateString = parse(monthString, 'MMMM yyyy', facilityNow);
    if (isValid(parsedDateString)) onChange?.(parsedDateString);
  };

  return (
    <StyledDatePicker
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      yearsPerRow={4}
      monthsPerRow={4}
      defaultValue={defaultValue ?? startOfDay(facilityNow)}
      slots={{
        openPickerIcon: open ? ExpandLessIcon : ExpandMoreIcon,
        switchViewButton: ExpandLessIcon,
        textField: TextInput,
        popper: StyledPopper,
      }}
      slotProps={{
        textField: {
          onBlur: (e) => handleMonthChange(e.target.value),
          onKeyDown: (e) => {
            if (e.key === 'Enter') {
              handleMonthChange(e.target.value);
            }
          },
          ...props,
        },
      }}
      onAccept={(date) => {
        if (isValid(date)) onChange?.(date);
      }}
      minDate={minDate ?? startOfYear(add(facilityNow, { years: -3 }))}
      maxDate={maxDate ?? endOfYear(add(facilityNow, { years: 4 }))}
      value={value}
      {...props}
    />
  );
};
