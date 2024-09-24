import React, { useMemo, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import { Colors } from '../../constants';
import { StyledExpandLess, StyledExpandMore } from './FieldCommonComponents';
import { add, endOfYear, startOfYear } from 'date-fns';
import { TextInput } from './TextField';
import { Popper, styled } from '@mui/material';

const getMaxDate = () => {
  return endOfYear(add(new Date(), { years: 8 }));
};

const getMinDate = () => {
  return startOfYear(add(new Date(), { years: -3 }));
};

// In rem units
const calendarButtonHeight = 1.4375;
const calendarButtonYMargin = 0.25;
const calendarButtonTotalHeight = calendarButtonHeight + calendarButtonYMargin * 2;

const StyledPopper = styled(Popper)`
  & .MuiPaper-root {
    border: 1px solid ${Colors.outline};
    box-shadow: none;
  }
  & .MuiDateCalendar-root {
    height: auto;
    max-height: ${calendarButtonTotalHeight *
      3}rem; // Prevent calendar from flickering when switching between month and year views
    max-width: 13.125rem;
    margin-bottom: 0.75rem;
  }
  & .MuiMonthCalendar-root,
  & .MuiYearCalendar-root {
    width: auto;
    max-height: ${calendarButtonTotalHeight * 2}rem;
    overflow-y: auto;
    padding-inline: 0.625rem;
  }
  & .MuiPickersYear-yearButton,
  & .MuiPickersMonth-monthButton {
    color: ${Colors.darkestText};
    font-weight: 500;
    font-size: 0.6875rem;
    width: 2.875rem;
    height: ${calendarButtonHeight}rem;
    margin-top: ${calendarButtonYMargin}rem;
    margin-bottom: ${calendarButtonYMargin}rem;
  }
  & .MuiPickersYear-yearButton.Mui-selected,
  & .MuiPickersMonth-monthButton.Mui-selected {
    background-color: ${Colors.primary};
    color: white;
    &:hover,
    &:focus {
      background-color: ${Colors.primary};
    }
  }
  & .MuiPickersArrowSwitcher-root {
    width: 0px;
    height: 0px;
  }
  & .MuiPickersCalendarHeader-root {
    min-height: 0.9375rem;
  }
  & .MuiPickersCalendarHeader-labelContainer {
    font-size: 0.6875rem;
    line-height: 0.9375rem;
  }
`;

export const MonthYearInput = ({
  minDate: propMinDate,
  maxDate: propMaxDate,
  name,
  value,
  onChange = () => {},
  ...props
}) => {
  const [open, setOpen] = useState(false);
  const minDate = propMinDate || getMinDate();
  const maxDate = useMemo(() => propMaxDate || getMaxDate(), [propMaxDate]);
  return (
    <DatePicker
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      views={['month', 'year']}
      yearsPerRow={4}
      monthsPerRow={4}
      defaultValue={new Date()}
      slots={{
        openPickerIcon: open ? StyledExpandLess : StyledExpandMore,
        switchViewButton: StyledExpandLess,
        textField: TextInput,
        popper: StyledPopper,
      }}
      slotProps={{
        textField: {
          size: 'small', // Manually set size to small for appropriate text size
          ...props,
        },
      }}
      onAccept={date => {
        onChange({ target: { value: date, name } });
      }}
      minDate={minDate}
      maxDate={maxDate}
      value={value}
      {...props}
    />
  );
};
