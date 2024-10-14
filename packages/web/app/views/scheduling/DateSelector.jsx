import { Box } from '@material-ui/core';
import { ArrowBackIos, ArrowForwardIos, ArrowLeft, ArrowRight } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { eachDayOfInterval } from 'date-fns';
import React from 'react';

export const DateSelector = () => {
  const days = eachDayOfInterval({
    start: new Date(2014, 9, 1),
    end: new Date(2014, 9, 31),
  });
  console.log(days);
  return (
    <div>
      <h1>DateSelector</h1>
      <Box display="flex">
        <IconButton>
          <ArrowBackIos />
        </IconButton>
        {days.map((day, index) => (
          <Box key={index} display="flex" alignItems="center">
            {new Intl.DateTimeFormat('en-US', {
              weekday: 'narrow',
            }).format(day)}
          </Box>
        ))}
        <IconButton>
          <ArrowForwardIos />
        </IconButton>
      </Box>
    </div>
  );
};
