import React, { useState } from 'react';
import { Box } from '@material-ui/core';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { IconButton, styled } from '@mui/material';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isThisMonth,
  isToday,
  isWeekend,
  startOfMonth,
  subMonths,
} from 'date-fns';

import { BodyText, MonthYearInput, TextButton } from '../../components';
import { Colors } from '../../constants';

const DaysWrapper = styled(Box)`
  display: flex;
  overflow: auto;
  scrollbar-width: thin;
  width: 100%;
  padding-block: 0.5rem;
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
  padding: 0.25rem;
  padding-inline: 0.375rem;
  border-radius: 3px;
  flex-grow: 1;
  user-select: none;
`;

const DateText = styled(BodyText)`
  min-width: 1.125rem;
  text-align: center;
`;

const WeekdayText = styled(DateText)`
  color: ${({ $selected, $isWeekend }) =>
    $selected ? Colors.white : $isWeekend ? Colors.softText : Colors.midText};
`;

const TodayButton = styled(TextButton)`
  margin-inline: 0.375rem;
  font-size: 0.875rem;
  text-decoration: underline;
  &:hover {
    text-decoration: underline;
  }
`;

const StepperButton = styled(IconButton)`
  padding: 0.25rem;
`;

const getMonthInterval = date =>
  eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });

const DayButton = ({ date, selected, onClick }) => (
  <DayWrapper onClick={onClick} $selected={selected} $isToday={isToday(date)}>
    <WeekdayText $selected={selected} $isWeekend={isWeekend(date)}>
      {format(date, 'EEEEE')}
    </WeekdayText>
    <DateText>{date.getDate()}</DateText>
  </DayWrapper>
);

export const DateSelector = ({ value, onChange }) => {
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

  const handleChangeToday = () => handleChange(new Date());
  const handleMonthYearChange = e => {
    const newDate = e.target.value;
    if (isThisMonth(newDate)) {
      handleChangeToday();
      return;
    }
    handleChange(startOfMonth(newDate));
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <MonthYearInput value={viewedDays[0]} onChange={handleMonthYearChange} />
      <TodayButton onClick={handleChangeToday}>Today</TodayButton>
      <StepperButton onClick={handleDecrement}>
        <ArrowBackIos fontSize="0.5rem" />
      </StepperButton>
      <DaysWrapper>
        {viewedDays.map(date => (
          <DayButton
            date={date}
            selected={isSameDay(date, value)}
            onClick={() => handleChange(date)}
            key={`day-button-${date.getTime()}`}
          />
        ))}
      </DaysWrapper>
      <StepperButton onClick={handleIncrement}>
        <ArrowForwardIos fontSize="0.5rem" />
      </StepperButton>
    </Box>
  );
};
