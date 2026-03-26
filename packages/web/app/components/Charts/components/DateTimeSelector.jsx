import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { debounce } from 'lodash';
import { addDays, parseISO, startOfDay } from 'date-fns';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import {
  useDateTime,
  SelectInput as SelectInputComponent,
  DateInput as DateInputComponent,
} from '@tamanu/ui-components';

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
const DATE_FORMAT = 'yyyy-MM-dd';

const OPTIONS = [
  {
    value: 'Last 24 hours',
    label: 'Last 24 hours',
    getDefaultStartDate: getNow => addDays(getNow(), -1),
  },
  {
    value: 'Last 48 hours',
    label: 'Last 48 hours',
    getDefaultStartDate: getNow => addDays(getNow(), -2),
  },
  {
    value: CUSTOM_DATE,
    label: 'Custom Date',
    getDefaultStartDate: getNow => startOfDay(getNow()),
    getDefaultEndDate: getNow => addDays(startOfDay(getNow()), 1),
  },
];

export const DateTimeSelector = props => {
  const { dateRange, setDateRange } = props;
  const [startDateString] = dateRange;

  const { getCurrentDateTime } = useDateTime();
  const getNow = useCallback(() => parseISO(getCurrentDateTime().replace(' ', 'T')), [getCurrentDateTime]);

  const [value, setValue] = useState(OPTIONS[0].value);

  const formatAndSetDateRange = useCallback(
    (newStartDate, newEndDate) => {
      const newStartDateString = toDateTimeString(newStartDate);
      const newEndDateString = toDateTimeString(newEndDate);
      setDateRange([newStartDateString, newEndDateString]);
    },
    [setDateRange],
  );

  useEffect(() => {
    const { getDefaultStartDate, getDefaultEndDate } = OPTIONS.find(
      option => option.value === value,
    );
    const newStartDate = getDefaultStartDate ? getDefaultStartDate(getNow) : getNow();
    const newEndDate = getDefaultEndDate ? getDefaultEndDate(getNow) : getNow();

    formatAndSetDateRange(newStartDate, newEndDate);
  }, [value, formatAndSetDateRange, getNow]);

  return (
    <Wrapper data-testid="wrapper-onhu">
      <SelectInput
        options={OPTIONS}
        value={value}
        isClearable={false}
        onChange={v => {
          setValue(v.target.value);
        }}
        size="small"
        data-testid="selectinput-i6gc"
      />
      {value === CUSTOM_DATE && (
        <DateInput
          size="small"
          // set format so we can safely use parseISO
          format={DATE_FORMAT}
          value={startDateString}
          onChange={debounce(newValue => {
            const { value: dateString } = newValue.target;
            if (dateString) {
              const selectedDayDate = parseISO(dateString);
              const startOfDayDate = startOfDay(selectedDayDate);
              const endOfDayDate = startOfDay(addDays(selectedDayDate, 1));

              formatAndSetDateRange(startOfDayDate, endOfDayDate);
            }
          }, 200)}
          arrows
          data-testid="dateinput-z016"
        />
      )}
    </Wrapper>
  );
};
