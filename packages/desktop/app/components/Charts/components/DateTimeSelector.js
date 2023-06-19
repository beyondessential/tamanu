import React, { useEffect, useCallback, useState } from 'react';
import styled from 'styled-components';
import { toCountryDateString } from '@tamanu/shared/utils/dateTime';
import { addDays, format, startOfDay } from 'date-fns';

import { DateInput as DateInputComponent, SelectInput as SelectInputComponent } from '../../Field';

const Wrapper = styled.div`
  display: flex;
  gap: 24px;
  padding-left: 79px;
  padding-bottom: 10px;
`;

const SelectInput = styled(SelectInputComponent)`
  width: 158px;
`;

const DateInput = styled(DateInputComponent)`
  width: 158px;
`;

const CUSTOM_DATE = 'Custom Date';
const DATE_TIME_TIMEZONE_FORMAT = 'yyyy-MM-dd HH:mm:ssX';

const options = [
  {
    value: 'Last 24 hours',
    label: 'Last 24 hours',
    startDateOffset: -1,
  },
  {
    value: 'Last 48 hours',
    label: 'Last 48 hours',
    startDateOffset: -2,
  },
  {
    value: CUSTOM_DATE,
    label: 'Custom Date',
  },
];

export const DateTimeSelector = props => {
  const { setStartDate, setEndDate } = props;
  const [value, setValue] = useState(options[0].value);

  const formatAndSetStartDate = useCallback(
    newStartDate => {
      setStartDate(format(newStartDate, DATE_TIME_TIMEZONE_FORMAT));
    },
    [setStartDate],
  );
  const formatAndSetEndDate = useCallback(
    newEndDate => {
      setEndDate(format(newEndDate, DATE_TIME_TIMEZONE_FORMAT));
    },
    [setEndDate],
  );

  useEffect(() => {
    const { startDateOffset } = options.find(option => option.value === value);
    if (startDateOffset) {
      formatAndSetStartDate(addDays(new Date(), startDateOffset));
      formatAndSetEndDate(new Date());
    }
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
          onChange={newValue => {
            const { value: newDate } = newValue.target;
            if (newDate) {
              const dateString = toCountryDateString(newDate);
              formatAndSetStartDate(startOfDay(new Date(dateString)));
              formatAndSetEndDate(startOfDay(addDays(new Date(dateString), 1)));
            }
          }}
        />
      )}
    </Wrapper>
  );
};
