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
} from 'date-fns';
import React, { useState } from 'react';
import { BodyText } from '../../components';
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
  ${({ $isToday }) => $isToday && `border: 1px solid ${Colors.primary};`}
  & div {
    min-width: 18px;
    text-align: center;
  }
`;

const WeekdayText = styled(BodyText)`
  color: ${({ $selected, $isWeekend }) =>
    $selected ? Colors.white : $isWeekend ? Colors.softText : 'inherit'};
`;

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

const getMonthInterval = date =>
  eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });

export const DateSelector = ({ date = new Date() }) => {
  const [days, setDays] = useState(getMonthInterval(date));
  const [selectedDate, setSelectedDate] = useState(days.find(isToday));

  const handleDecrement = async () => {
    setDays(getMonthInterval(subMonths(days[0], 1)));
  };

  const handleIncrement = () => {
    setDays(getMonthInterval(addMonths(days[0], 1)));
  };

  return (
    <div>
      <h1>DateSelector</h1>
      <h2>Month {days[0].toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
      <Box display="flex" alignItems="center" gap="5px">
        <IconButton onClick={handleDecrement}>
          <ArrowBackIos />
        </IconButton>
        {days.map(day => (
          <DayButton
            key={`day-${day.getTime()}`}
            day={day}
            selected={selectedDate.getTime() === day.getTime()}
            onClick={() => setSelectedDate(day)}
          />
        ))}
        <IconButton onClick={handleIncrement}>
          <ArrowForwardIos />
        </IconButton>
      </Box>
    </div>
  );
};
