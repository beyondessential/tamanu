import React, { useState } from 'react';
import ArrowBackIos from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import {
  addDays,
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
  startOfToday,
  subDays,
  subMonths,
} from 'date-fns';

import { BodyText, MonthYearInput, TextButton } from '../../../components';
import { Colors } from '../../../constants';

const Wrapper = styled(Box)`
  display: flex;
  align-items: center;
  padding: 0.3rem 0.48rem;
  gap: 0.5rem;
`;

const DaysWrapper = styled(Box)`
  display: flex;
  overflow: auto;
  scrollbar-width: thin;
  width: 100%;
  padding-block: 0.25rem;
  justify-content: space-around;
`;

const DayWrapper = styled('button')`
  touch-action: manipulation
  appearance: none;
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
  max-inline-size: 2.25rem;
  user-select: none;
  &:hover {
    background-color: ${({ $selected }) => ($selected ? Colors.primary : Colors.veryLightBlue)};
  }
`;

const DateText = styled(BodyText)`
  min-width: 1.125rem;
  text-align: center;
  color: ${({ $selected, $isWeekend }) => {
    if ($selected) return Colors.white;
    if ($isWeekend) return Colors.midText;
    return Colors.darkestText;
  }};
`;

const WeekdayText = styled(DateText)`
  font-size: 0.688rem;
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
  inline-size: 100%;
`;

const getMonthInterval = date =>
  eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });

const DayButton = ({ date, selected, onClick }) => {
  const isWeekendDay = isWeekend(date);
  return (
    <DayWrapper onClick={onClick} $selected={selected} $isToday={isToday(date)}>
      <WeekdayText $isWeekend={isWeekendDay} $selected={selected}>
        {format(date, 'EEEEE')}
      </WeekdayText>
      <DateText $isWeekend={isWeekendDay} $selected={selected}>
        {date.getDate()}
      </DateText>
    </DayWrapper>
  );
};

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

  const handleChangeToday = () => handleChange(startOfToday());

  const handleMonthYearChange = newDate => {
    if (isThisMonth(newDate)) {
      handleChangeToday();
      return;
    }
    handleChange(startOfMonth(newDate));
  };

  const handleOnKeyDown = e => {
    if (e.key === 'ArrowLeft') {
      if (isSameDay(value, viewedDays[0])) return;
      handleChange(subDays(value, 1));
      e.target.previousElementSibling.focus();
    }

    if (e.key === 'ArrowRight') {
      if (isSameDay(value, viewedDays.at(-1))) return;
      handleChange(addDays(value, 1));
      e.target.nextElementSibling.focus();
    }
  };

  return (
    <Wrapper onKeyDown={handleOnKeyDown}>
      <StyledMonthYearInput value={viewedDays[0]} onChange={handleMonthYearChange} />
      <TodayButton onClick={handleChangeToday}>Today</TodayButton>
      <StepperWrapper>
        <StepperButton onClick={handleDecrement}>
          <ArrowBackIos />
        </StepperButton>
        <DaysWrapper>
          {viewedDays.map(date => (
            <DayButton
              aria-pressed={isSameDay(date, value)}
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
