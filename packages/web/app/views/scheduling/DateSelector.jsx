import React, { useState } from 'react';
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
} from 'date-fns';

import { BodyText, TextButton } from '../../components';
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
`;

const WeekdayText = styled(BodyText)`
  color: ${({ $selected, $isWeekend }) =>
    $selected ? Colors.white : $isWeekend ? Colors.softText : Colors.midText};
  min-width: 18px;
  text-align: center;
`;

const DateText = styled(BodyText)`
  min-width: 18px;
  text-align: center;
`;

const TodayButton = styled(TextButton)`
  margin-inline: 8px;
  text-decoration: underline;
  &:hover {
    text-decoration: underline;
  }
`;

const getMonthInterval = date =>
  eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });

const DayButton = ({ day, selected, onClick }) => {
  return (
    <DayWrapper onClick={onClick} $selected={selected} $isToday={isToday(day)}>
      <WeekdayText $selected={selected} $isWeekend={isWeekend(day)}>
        {day.toLocaleDateString('default', {
          weekday: 'narrow',
        })}
      </WeekdayText>
      <DateText>{day.getDate()}</DateText>
    </DayWrapper>
  );
};

export const DateSelector = ({ initialDate = startOfDay(new Date()) }) => {
  const [days, setDays] = useState(getMonthInterval(initialDate));
  const [selectedDate, setSelectedDate] = useState(days.find(isToday));

  const handleDecrement = async () => setDays(getMonthInterval(subMonths(days[0], 1)));

  const handleIncrement = () => setDays(getMonthInterval(addMonths(days[0], 1)));

  const handleSetToday = () => {
    setSelectedDate(startOfDay(new Date()));
    if (days[0].getMonth() !== new Date().getMonth()) {
      setDays(getMonthInterval(new Date()));
    }
  };

  return (
    <div>
      <h2>Month {days[0].toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <TodayButton onClick={handleSetToday}>Today</TodayButton>
        <IconButton onClick={handleDecrement}>
          <ArrowBackIos />
        </IconButton>
        <DaysWrapper>
          {days.map(day => (
            <DayButton
              key={`day-${day.getTime()}`}
              day={day}
              selected={selectedDate.getTime() === day.getTime()}
              onClick={() => setSelectedDate(day)}
            />
          ))}
        </DaysWrapper>
        <IconButton onClick={handleIncrement}>
          <ArrowForwardIos />
        </IconButton>
      </Box>
    </div>
  );
};
