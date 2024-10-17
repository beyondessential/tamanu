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
  text-decoration: underline;
  &:hover {
    text-decoration: underline;
  }
`;

const getMonthInterval = date => {
  const start = startOfDay(date);
  return eachDayOfInterval({
    start: startOfMonth(start),
    end: endOfMonth(start),
  });
};

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

export const DateSelector = ({ value = new Date(), onChange }) => {
  const [viewedDays, setViewedDays] = useState(getMonthInterval(value));

  const handleChange = day =>
    onChange({
      target: {
        value: day,
      },
    });

  const handleIncrement = () => setViewedDays(getMonthInterval(addMonths(viewedDays[0], 1)));
  const handleDecrement = () => setViewedDays(getMonthInterval(subMonths(viewedDays[0], 1)));

  const handleSetToday = () => handleChange(new Date());

  useEffect(() => {
    if (isSameMonth(value, viewedDays[0])) return;
    setViewedDays(getMonthInterval(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div>
      <h2>Month {viewedDays[0].toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <TodayButton onClick={handleSetToday}>Today</TodayButton>
        <IconButton onClick={handleDecrement}>
          <ArrowBackIos />
        </IconButton>
        <DaysWrapper>
          {viewedDays.map(day => (
            <DayButton
              day={day}
              selected={value.getTime() === day.getTime()}
              onClick={() => handleChange(day)}
              key={`day-${day.getTime()}`}
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
