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
import React, { useState } from 'react';
import { BodyText, TextButton } from '../../components';
import { Colors } from '../../constants';

const DayWrapper = styled(Box)`
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  padding-inline: 10px;
  border-radius: 3px;
  background-color: ${({ $selected }) => ($selected ? Colors.primary : 'transparent')};
  color: ${({ $selected }) => ($selected ? Colors.white : 'inherit')};
  border: 1px solid ${({ $isToday }) => ($isToday ? Colors.primary : 'transparent')};
  flex-grow: 1;
  & div {
    min-width: 18px;
    text-align: center;
  }
`;

const DaysWrapper = styled(Box)`
  display: flex;
  overflow: auto;
  scrollbar-width: thin;
  width: 100%;
  padding-block: 8px;
  justify-content: space-between;
`;

const WeekdayText = styled(BodyText)`
  color: ${({ $selected, $isWeekend }) =>
    $selected ? Colors.white : $isWeekend ? Colors.softText : Colors.midText};
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
      <BodyText>{day.getDate()}</BodyText>
    </DayWrapper>
  );
};

export const DateSelector = ({ date = startOfDay(new Date()) }) => {
  const [days, setDays] = useState(getMonthInterval(date));
  const [selectedDate, setSelectedDate] = useState(days.find(isToday));

  const handleDecrement = async () => {
    setDays(getMonthInterval(subMonths(days[0], 1)));
  };

  const handleIncrement = () => {
    setDays(getMonthInterval(addMonths(days[0], 1)));
  };

  const handleSetToday = () => {
    setSelectedDate(startOfDay(new Date()));
    if (!days.some(isToday)) {
      setDays(getMonthInterval(new Date()));
    }
  };

  return (
    <div>
      <h1>DateSelector</h1>
      <h2>Month {days[0].toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <TextButton onClick={handleSetToday}>Today</TextButton>
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
