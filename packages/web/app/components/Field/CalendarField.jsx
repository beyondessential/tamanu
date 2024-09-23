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

const StyledPopper = styled(Popper)({
  '& .MuiPaper-root': {
    border: `1px solid ${Colors.outline}`,
    boxShadow: 'none',
  },
  '& .MuiDateCalendar-root': {
    height: 'auto',
    maxHeight: `${calendarButtonTotalHeight * 3}rem`, // Prevent calendar from flickering when switching between month and year views
    maxWidth: '13.125rem',
    marginBottom: '0.75rem',
  },
  '& .MuiMonthCalendar-root, & .MuiYearCalendar-root': {
    width: 'auto',
    maxHeight: `${calendarButtonTotalHeight * 2}rem`,
    overflowY: 'auto',
    paddingInline: '0.625rem',
  },
  '& .MuiPickersYear-yearButton, & .MuiPickersMonth-monthButton': {
    color: `${Colors.darkestText}`,
    fontWeight: 500,
    fontSize: '0.6875rem',
    width: '2.875rem',
    height: `${calendarButtonHeight}rem`,
    marginTop: `${calendarButtonYMargin}rem`,
    marginBottom: `${calendarButtonYMargin}rem`,
  },
  '& .MuiPickersYear-yearButton.Mui-selected, & .MuiPickersMonth-monthButton.Mui-selected': {
    backgroundColor: `${Colors.primary}`,
    color: 'white',
    '&:hover, &:focus': {
      backgroundColor: `${Colors.primary}`,
    },
  },
  '& .MuiPickersArrowSwitcher-root': {
    width: '0px',
    height: '0px',
  },
  '& .MuiPickersCalendarHeader-root': {
    minHeight: '0.9375rem',
  },
  '& .MuiPickersCalendarHeader-labelContainer': {
    fontSize: '0.6875rem',
    lineHeight: '0.9375rem',
  },
});

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
