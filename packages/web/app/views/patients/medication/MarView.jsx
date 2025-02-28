import React, { useState } from 'react';
import { MarHeader } from './MarHeader';
import { MarTable } from './MarTable';

export const MarView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const handleDateChange = date => setSelectedDate(date);
  return (
    <div>
      <MarHeader selectedDate={selectedDate} onDateChange={handleDateChange} />
      <MarTable selectedDate={selectedDate} />
    </div>
  );
};
