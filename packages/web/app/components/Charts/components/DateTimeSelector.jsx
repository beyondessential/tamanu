import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { debounce } from 'es-toolkit/compat';
import { addDays, parseISO, startOfDay, subYears } from 'date-fns';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import {
  useDateTime,
  SelectInput as SelectInputComponent,
  DateInput as DateInputComponent,
  TranslatedText,
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

// Ordered from smallest to largest range, with custom date last
const OPTIONS = [
  {
    value: 'Last 24 hours',
    label: <TranslatedText stringId="chart.dateRange.option.last24Hours" fallback="Last 24 hours" />,
    getDefaultStartDate: getNow => addDays(getNow(), -1),
  },
  {
    value: 'Last 48 hours',
    label: <TranslatedText stringId="chart.dateRange.option.last48Hours" fallback="Last 48 hours" />,
    getDefaultStartDate: getNow => addDays(getNow(), -2),
  },
  {
    value: 'Last 7 days',
    label: <TranslatedText stringId="chart.dateRange.option.last7Days" fallback="Last 7 days" />,
    getDefaultStartDate: getNow => addDays(getNow(), -7),
  },
  {
    value: 'Last 30 days',
    label: <TranslatedText stringId="chart.dateRange.option.last30Days" fallback="Last 30 days" />,
    getDefaultStartDate: getNow => addDays(getNow(), -30),
  },
  {
    value: 'Last year',
    label: <TranslatedText stringId="chart.dateRange.option.lastYear" fallback="Last year" />,
    getDefaultStartDate: getNow => subYears(getNow(), 1),
    isProgramRegistryOnly: true,
  },
  {
    value: CUSTOM_DATE,
    label: <TranslatedText stringId="chart.dateRange.option.customDate" fallback="Custom Date" />,
    getDefaultStartDate: getNow => startOfDay(getNow()),
    getDefaultEndDate: getNow => addDays(startOfDay(getNow()), 1),
  },
];

export const DateTimeSelector = props => {
  const { dateRange, setDateRange, showProgramRegistryOptions = false } = props;
  const [startDateString] = dateRange;

  const options = showProgramRegistryOptions
    ? OPTIONS
    : OPTIONS.filter(option => !option.isProgramRegistryOnly);

  const { getCurrentDateTime } = useDateTime();
  const getNow = useCallback(() => parseISO(getCurrentDateTime()), [getCurrentDateTime]);

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
        options={options}
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
