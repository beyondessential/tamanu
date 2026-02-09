import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useDateTimeFormat } from '@tamanu/ui-components';
import { MarHeader } from '../../../components/Medication/Mar/MarHeader';
import { MarTable } from '../../../components/Medication/Mar/MarTable';
import { Colors } from '../../../constants';
import { set } from 'date-fns';
import { useEncounter } from '../../../contexts/Encounter';

const MarContainer = styled.div`
  border-bottom: 1px solid ${Colors.outline};
  border-right: 1px solid ${Colors.outline};
`;

const parseFacilityDateTime = dateTimeString =>
  new Date(dateTimeString.replace(' ', 'T'));

export const MarView = () => {
  const { encounter } = useEncounter();
  const { getFacilityCurrentDateTimeString } = useDateTimeFormat();

  const getFacilityNowRef = useRef(getFacilityCurrentDateTimeString);
  getFacilityNowRef.current = getFacilityCurrentDateTimeString;

  const [selectedDate, setSelectedDate] = useState(() => {
    const facilityNow = parseFacilityDateTime(getFacilityCurrentDateTimeString());
    return new Date(encounter?.endDate) < facilityNow
      ? new Date(encounter?.endDate)
      : facilityNow;
  });
  const handleDateChange = date => setSelectedDate(date);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = parseFacilityDateTime(getFacilityNowRef.current());
      setSelectedDate(prev =>
        set(prev, { hours: now.getHours(), minutes: now.getMinutes() }),
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <MarContainer>
      <MarHeader selectedDate={selectedDate} onDateChange={handleDateChange} />
      <MarTable selectedDate={selectedDate} />
    </MarContainer>
  );
};
