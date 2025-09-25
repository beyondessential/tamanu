import React, { useEffect, useState } from 'react';
import ArrowBackIos from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import { css, styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isThisMonth,
  isToday,
  isWeekend,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';

import { eachDayInMonth } from '@tamanu/utils/dateTime';

import { BodyText, MonthPicker } from '../../../components';
import { TextButton } from '@tamanu/ui-components';
import { Colors } from '../../../constants';

const Wrapper = styled(Box)`
  display: flex;
  align-items: center;
  padding-block: 0.3rem;
  padding-inline: 0.48rem;
  gap: 0.5rem;
`;

const DaysWrapper = styled(Box)`
  display: flex;
  overflow: auto;
  scrollbar-width: thin;
  inline-size: 100%;
  padding-block: 0.25rem;
  justify-content: space-around;
`;

const DayWrapper = styled('button')`
  touch-action: manipulation;
  appearance: none;
  background-color: transparent;
  border: max(0.0625rem, 1px) solid transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  align-items: center;
  padding: 0.25rem;
  border-radius: 0.1875rem;
  flex-grow: 1;
  max-inline-size: 2.25rem;
  user-select: none;

  &:hover {
    background-color: ${Colors.veryLightBlue};
  }

  ${({ $selected }) =>
    $selected &&
    css`
      color: ${Colors.white};

      &,
      &:hover {
        background-color: ${Colors.primary};
      }
    `}

  ${({ $isToday }) =>
    $isToday &&
    css`
      border-color: ${Colors.primary};
    `}
`;

const DateText = styled(BodyText)`
  min-inline-size: 1.125rem;
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

  &,
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

const StyledMonthPicker = styled(MonthPicker)`
  inline-size: 6.3rem;
  & .MuiInputBase-root > input {
    block-size: 1.039rem;
    font-size: 0.875rem;
  }
`;

const StepperWrapper = styled(Box)`
  display: flex;
  align-items: center;
  overflow: hidden;
  inline-size: 100%;
`;

const DayButton = ({ date, selected, onClick }) => {
  const isWeekendDay = isWeekend(date);
  return (
    <DayWrapper
      onClick={onClick}
      $selected={selected}
      $isToday={isToday(date)}
      data-testid={`daywrapper-2vbq-${format(date, 'EEEEE')}-${date.getDate()}`}
    >
      <WeekdayText $isWeekend={isWeekendDay} $selected={selected}>
        {format(date, 'EEEEE')}
      </WeekdayText>
      <DateText $isWeekend={isWeekendDay} $selected={selected} data-testid="datetext-gl3a">
        {date.getDate()}
      </DateText>
    </DayWrapper>
  );
};

export const DateSelector = ({ value, onChange }) => {
  const [viewedDays, setViewedDays] = useState(eachDayInMonth(value));

  useEffect(() => {
    setViewedDays(eachDayInMonth(value));
  }, [value]);

  const handleIncrement = () => setViewedDays(eachDayInMonth(addMonths(viewedDays[0], 1)));
  const handleDecrement = () => setViewedDays(eachDayInMonth(subMonths(viewedDays[0], 1)));

  const handleChange = (day) => {
    onChange({
      target: {
        value: day,
      },
    });

    if (isSameMonth(day, viewedDays[0])) return;
    setViewedDays(eachDayInMonth(day));
  };

  const handleChangeToday = () => handleChange(new Date());

  const handleMonthYearChange = (newDate) => {
    if (isThisMonth(newDate)) {
      handleChangeToday();
      return;
    }
    handleChange(startOfMonth(newDate));
  };

  const handleOnKeyDown = (e) => {
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
    <Wrapper onKeyDown={handleOnKeyDown} data-testid="wrapper-up3h">
      <StyledMonthPicker
        key={value.valueOf()}
        value={viewedDays[0]}
        onChange={handleMonthYearChange}
        data-testid="styledmonthpicker-3pmc"
      />
      <TodayButton onClick={handleChangeToday} data-testid="todaybutton-4gqy">
        Today
      </TodayButton>
      <StepperWrapper data-testid="stepperwrapper-4wbc">
        <StepperButton onClick={handleDecrement} data-testid="stepperbutton-s2jx">
          <ArrowBackIos data-testid="arrowbackios-jjro" />
        </StepperButton>
        <DaysWrapper data-testid="dayswrapper-f31b">
          {viewedDays.map((date) => (
            <DayButton
              aria-pressed={isSameDay(date, value)}
              date={date}
              selected={isSameDay(date, value)}
              onClick={() => handleChange(date)}
              key={`day-button-${date.getTime()}`}
            />
          ))}
        </DaysWrapper>
        <StepperButton onClick={handleIncrement} data-testid="stepperbutton-3zzm">
          <ArrowForwardIos data-testid="arrowforwardios-xpst" />
        </StepperButton>
      </StepperWrapper>
    </Wrapper>
  );
};
