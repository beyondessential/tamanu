import React, { useMemo, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import { Colors } from '../../constants';
import { StyledExpandLess, StyledExpandMore } from './FieldCommonComponents';
import { add, endOfYear, startOfYear } from 'date-fns';
import { TextInput } from './TextField';

const getMaxDate = () => {
  return endOfYear(add(new Date(), { years: 8 }));
};

const getMinDate = () => {
  return startOfYear(add(new Date(), { years: -3 }));
};

const popperStyles = {
  '& .MuiPaper-root': {
    border: `1px solid ${Colors.outline}`,
    boxShadow: 'none',
  },
  '& .MuiDateCalendar-root': {
    height: 'auto',
    maxHeight: '93px', // Prevent calendar from flickering when switching between month and year views
    maxWidth: '210px',
    marginBottom: '12px',
  },
  '& .MuiMonthCalendar-root, .MuiYearCalendar-root': {
    width: 'auto',
    maxHeight: '62px',
    overflowY: 'auto',
    paddingX: '10px',
  },
  '& .MuiPickersYear-yearButton, .MuiPickersMonth-monthButton': {
    color: `${Colors.darkestText}`,
    fontWeight: 500,
    fontSize: '11px',
    width: '46px',
    height: '23px',
    marginY: '4px',
  },
  '& .MuiPickersYear-yearButton.Mui-selected, .MuiPickersMonth-monthButton.Mui-selected': {
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
};

const calendarHeaderStyles = {
  minHeight: '15px', // Overrides default
  '& .MuiPickersCalendarHeader-labelContainer': {
    fontSize: '11px',
    lineHeight: '15px',
  },
};

export const MonthYearInput = ({
  minDate: propMinDate,
  maxDate: propMaxDate,
  onChange = () => {},
  ...props
}) => {
  const [open, setOpen] = useState(false);
  const minDate = useMemo(() => propMinDate || getMinDate(), [propMinDate]);
  const maxDate = useMemo(() => propMaxDate || getMaxDate(), [propMaxDate]);
  console.log(onChange);
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
      }}
      slotProps={{
        popper: { sx: popperStyles },
        calendarHeader: {
          sx: calendarHeaderStyles,
        },
        textField: {
          size: 'small', // Manually set size to small for appropriate text size
        },
      }}
      minDate={minDate}
      maxDate={maxDate}
      onAccept={date => onChange(date)}
      {...props}
    />
  );
};
