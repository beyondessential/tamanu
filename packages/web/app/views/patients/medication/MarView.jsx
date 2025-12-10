import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { MarHeader } from '../../../components/Medication/Mar/MarHeader';
import { MarTable } from '../../../components/Medication/Mar/MarTable';
import { Colors } from '../../../constants';
import { set } from 'date-fns';
import { useEncounter } from '../../../contexts/Encounter';

const MarContainer = styled.div`
  border-bottom: 1px solid ${Colors.outline};
  border-right: 1px solid ${Colors.outline};
`;

export const MarView = () => {
  const { encounter } = useEncounter();

  const defaultSelectedDate =
    new Date(encounter?.endDate) < new Date() ? new Date(encounter?.endDate) : new Date();
  const [selectedDate, setSelectedDate] = useState(defaultSelectedDate);
  const handleDateChange = date => setSelectedDate(date);

  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedDate(prev =>
        set(prev, { hours: new Date().getHours(), minutes: new Date().getMinutes() }),
      );
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <MarContainer>
      <MarHeader selectedDate={selectedDate} onDateChange={handleDateChange} />
      <MarTable selectedDate={selectedDate} />
    </MarContainer>
  );
};
