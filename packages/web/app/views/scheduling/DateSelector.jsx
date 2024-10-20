import React, { useEffect, useState } from 'react';
import { Box } from '@material-ui/core';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { IconButton, styled } from '@mui/material';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  isToday,
  isWeekend,
  startOfMonth,
  subMonths,
  startOfDay,
  isSameMonth,
  isSameDay,
  format,
} from 'date-fns';

import { BodyText, MonthYearInput, TextButton } from '../../components';
import { Colors } from '../../constants';

const DaysWrapper = styled(Box)`
  display: flex;
  overflow: auto;
  scrollbar-width: thin;
  width: 100%;
  padding-block: 8px;
  justify-content: space-between;
`;

const DayWrapper = styled(Box)`
  background-color: ${({ $selected }) => ($selected ? Colors.primary : 'transparent')};
  border: 1px solid ${({ $isToday }) => ($isToday ? Colors.primary : 'transparent')};
  color: ${({ $selected }) => ($selected ? Colors.white : 'inherit')};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  padding-inline: 6px;
  border-radius: 3px;
  flex-grow: 1;
  user-select: none;
`;

const DateText = styled(BodyText)`
  min-width: 18px;
  text-align: center;
`;

const WeekdayText = styled(DateText)`
  color: ${({ $selected, $isWeekend }) =>
    $selected ? Colors.white : $isWeekend ? Colors.softText : Colors.midText};
`;

const TodayButton = styled(TextButton)`
  margin-inline: 8px;
  font-size: 0.875rem;
  text-decoration: underline;
  &:hover {
    text-decoration: underline;
  }
`;

const StepperButton = styled(IconButton)`
  padding: 4px;
`;

const getMonthInterval = date => {
  const start = startOfDay(date);
  return eachDayOfInterval({
    start: startOfMonth(start),
    end: endOfMonth(start),
  });
};

const DayButton = ({ date, selected, onClick }) => (
  <DayWrapper onClick={onClick} $selected={selected} $isToday={isToday(date)}>
    <WeekdayText $selected={selected} $isWeekend={isWeekend(date)}>
      {format(date, 'EEEEE')}
    </WeekdayText>
    <DateText>{date.getDate()}</DateText>
  </DayWrapper>
);

export const DateSelector = ({ value = new Date(), onChange }) => {
  const [viewedDays, setViewedDays] = useState(getMonthInterval(value));

  const handleIncrement = () => setViewedDays(getMonthInterval(addMonths(viewedDays[0], 1)));
  const handleDecrement = () => setViewedDays(getMonthInterval(subMonths(viewedDays[0], 1)));

  const handleChange = day => {
    onChange({
      target: {
        value: day,
      },
    });

    if (isSameMonth(day, viewedDays[0])) return;
    setViewedDays(getMonthInterval(day));
  };

  const handleMonthYearChange = e => {
    const date = e.target.value;
    const todayDate = new Date();
    if (isSameMonth(date, todayDate)) {
      handleChange(todayDate);
      return;
    }
    handleChange(startOfMonth(date));
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <MonthYearInput value={viewedDays[0]} onChange={handleMonthYearChange} />
      <TodayButton onClick={() => handleChange(new Date())}>Today</TodayButton>
      <StepperButton onClick={handleDecrement}>
        <ArrowBackIos fontSize="0.5rem" />
      </StepperButton>
      <DaysWrapper>
        {viewedDays.map(day => (
          <DayButton
            date={day}
            selected={isSameDay(day, value)}
            onClick={() => handleChange(day)}
            key={`day-${day.getTime()}`}
          />
        ))}
      </DaysWrapper>
      <StepperButton onClick={handleIncrement}>
        <ArrowForwardIos fontSize="0.5rem" />
      </StepperButton>
    </Box>
  );
};
