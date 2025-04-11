import React, { useState } from 'react';
import styled from 'styled-components';
import { MarHeader } from '../../../components/Medication/Mar/MarHeader';
import { MarTable } from '../../../components/Medication/Mar/MarTable';
import { Colors } from '../../../constants';

const MarContainer = styled.div`
  border-bottom: 1px solid ${Colors.outline};
  border-right: 1px solid ${Colors.outline};
`;

export const MarView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const handleDateChange = date => setSelectedDate(date);
  return (
    <MarContainer>
      <MarHeader selectedDate={selectedDate} onDateChange={handleDateChange} />
      <MarTable selectedDate={selectedDate} />
    </MarContainer>
  );
};
