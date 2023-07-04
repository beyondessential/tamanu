import React, { useEffect, useCallback, useState } from 'react';
import styled from 'styled-components';
import { addDays, format, startOfDay } from 'date-fns';

import { DateInput as DateInputComponent, SelectInput as SelectInputComponent } from '../../Field';
import { Y_AXIS_WIDTH } from '../constants';

const Wrapper = styled.div`
  display: flex;
  gap: 24px;
  padding-left: ${Y_AXIS_WIDTH}px;
  padding-bottom: 16px;
`;

const SelectInput = styled(SelectInputComponent)`
  width: 158px;
`;

const DateInput = styled(DateInputComponent)`
  width: 158px;
`;

const CUSTOM_DATE = 'Custom Date';
export const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

const options = [
  {
    value: 'Last 24 hours',
    label: 'Last 24 hours',
    getStartDate: () => addDays(new Date(), -1),
  },
  {
    value: 'Last 48 hours',
    label: 'Last 48 hours',
    getStartDate: () => addDays(new Date(), -2),
  },
  {
    value: CUSTOM_DATE,
    label: 'Custom Date',
    getStartDate: () => startOfDay(new Date()),
    getEndDate: () => startOfDay(addDays(new Date(), 1)),
  },
];

export const DateTimeSelector = props => {
  const { startDate: startDateString, setStartDate, setEndDate } = props;
  const [value, setValue] = useState(options[0].value);

  const formatAndSetStartDate = useCallback(
    newStartDate => {
      setStartDate(format(newStartDate, DATE_TIME_FORMAT));
    },
    [setStartDate],
  );
  const formatAndSetEndDate = useCallback(
    newEndDate => {
      setEndDate(format(newEndDate, DATE_TIME_FORMAT));
    },
    [setEndDate],
  );

  useEffect(() => {
    const { getStartDate, getEndDate } = options.find(option => option.value === value);
    const newStartDate = getStartDate ? getStartDate() : new Date();
    const newEndDate = getEndDate ? getEndDate() : new Date();

    formatAndSetStartDate(newStartDate);
    formatAndSetEndDate(newEndDate);
  }, [value, formatAndSetStartDate, formatAndSetEndDate]);

  return (
    <Wrapper>
      <SelectInput
        options={options}
        value={value}
        isClearable={false}
        onChange={v => {
          setValue(v.target.value);
        }}
        size="small"
      />
      {value === CUSTOM_DATE && (
        <DateInput
          size="small"
          saveDateAsString
          value={format(new Date(startDateString), 'yyyy-MM-dd')} // display date in yyyy-MM-dd format on text input
          onChange={newValue => {
            const { value: dateString } = newValue.target;
            if (dateString) {
              formatAndSetStartDate(startOfDay(new Date(dateString)));
              formatAndSetEndDate(startOfDay(addDays(new Date(dateString), 1)));
            }
          }}
          arrows
        />
      )}
    </Wrapper>
  );
};
