import React, { useMemo, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import { Popper, styled } from '@mui/material';
import { Colors } from '../../constants';
import { TextInput } from './TextField';
import { StyledExpandLess, StyledExpandMore } from './FieldCommonComponents';

const getMaxDate = () => {
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 8;
  return new Date(maxYear, 11, 31);
};

const getMinDate = () => {
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 3;
  return new Date(minYear, 0, 1);
};

const StyledDatePopper = styled(Popper)`
  & .MuiPaper-root {
    border: 1px solid ${Colors.outline};
    box-shadow: none;
  }
  & .MuiDateCalendar-root {
    height: auto;
    height: 172px;
  }
  & .MuiMonthCalendar-root {
    max-height: 104px;
    overflow-y: auto;
    margin-bottom: 12px;
  }
  & .MuiYearCalendar-root {
    max-height: 96px;
    overflow-y: auto;
    margin-bottom: 12px;
  }
  & .MuiPickersYear-yearButton.Mui-selected,
  .MuiPickersMonth-monthButton.Mui-selected {
    background-color: ${Colors.primary};
    color: white;
    &:hover,
    &:focus {
      background-color: ${Colors.primary};
    }
  }
`;

export const MonthYearInput = ({ minDate: propMinDate, maxDate: propMaxDate, ...props }) => {
  const [open, setOpen] = useState(false);
  const minDate = useMemo(() => propMinDate || getMinDate(), [propMinDate]);
  const maxDate = useMemo(() => propMaxDate || getMaxDate(), [propMaxDate]);
  2;
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
        popper: StyledDatePopper,
        textField: TextInput,
      }}
      minDate={minDate}
      maxDate={maxDate}
      {...props}
    />
  );
};
