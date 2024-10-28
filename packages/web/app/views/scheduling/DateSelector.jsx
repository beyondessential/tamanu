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

const Wrapper = styled(Box)`
  display: flex;
  align-items: center;
  // justify-content: space-between;
  padding: 0.3rem 0.48rem;
  gap: 0.5rem;
`;

const DaysWrapper = styled(Box)`
  display: flex;
  overflow: auto;
  scrollbar-width: thin;
  width: 100%;
  padding-block: 0.25rem;
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
  border-radius: 3px;
  flex-grow: 1;
  user-select: none;
`;

const DateText = styled(BodyText)`
  min-width: 1.125rem;
  text-align: center;
`;

const WeekdayText = styled(DateText)`
  color: ${({ $selected, $isWeekend }) => {
    if ($selected) return Colors.white;
    if ($isWeekend) return Colors.softText;
    return Colors.midText;
  }};
`;

const TodayButton = styled(TextButton)`
  margin-inline: 0.375rem;
  font-size: 0.75rem;
  text-decoration: underline;
  &:hover {
    text-decoration: underline;
  }
`;

const StepperButton = styled(IconButton)`
  padding: 0.25rem;
  & svg {
    font-size: 1.25rem;
  }
`;

const StyledMonthYearInput = styled(MonthYearInput)`
  width: 6.3rem;
  & .MuiInputBase-root > input {
    height: 1.039rem;
    font-size: 0.875rem;
  }
`;

const StepperWrapper = styled(Box)`
  display: flex;
  align-items: center;
  overflow: hidden;
  width: 70rem;
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
    <Wrapper>
      <StyledMonthYearInput value={viewedDays[0]} onChange={handleMonthYearChange} />
      <TodayButton onClick={handleChangeToday}>Today</TodayButton>
      <StepperWrapper>
        <StepperButton onClick={handleDecrement}>
          <ArrowBackIos />
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
          <ArrowForwardIos />
        </StepperButton>
      </StepperWrapper>
    </Wrapper>
  );
};
