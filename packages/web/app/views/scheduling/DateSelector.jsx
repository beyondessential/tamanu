import { Box } from '@material-ui/core';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { IconButton, styled } from '@mui/material';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns';
import React, { useMemo, useState } from 'react';
import { BodyText } from '../../components';
import { Colors } from '../../constants';

const DayWrapper = styled(Box)`
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

const DayButton = ({ day, selected, isToday }) => {
  return (
    <DayWrapper $selected={selected} $isToday={isToday}>
      <BodyText color={selected ? Colors.white : 'textTertiary'}>
        {day.toLocaleDateString('default', {
          weekday: 'narrow',
        })}
      </BodyText>
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
  const [selectedIndex, setSelectedIndex] = useState(4);

  const selectedDate = useMemo(() => days[selectedIndex], [days, selectedIndex]);

  const handleDecrement = async () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      return;
    }
    const newDays = getMonthInterval(subMonths(days[0], 1));
    setDays(newDays);
    setSelectedIndex(newDays.length - 1);
  };

  const handleIncrement = () => {
    if (selectedIndex < days.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      return;
    }
    setDays(getMonthInterval(addMonths(days[0], 1)));
    setSelectedIndex(0);
  };

  return (
    <div>
      <h1>DateSelector</h1>
      <Box display="flex" alignItems="center" gap="5px">
        <IconButton onClick={handleDecrement}>
          <ArrowBackIos />
        </IconButton>
        {days.map((day, index) => (
          <DayButton
            key={`day-${day.getTime()}`}
            isToday={isToday(day)}
            day={day}
            selected={index === selectedIndex}
          />
        ))}
        <IconButton onClick={handleIncrement}>
          <ArrowForwardIos />
        </IconButton>
      </Box>
    </div>
  );
};
