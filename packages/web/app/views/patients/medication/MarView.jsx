import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { set } from 'date-fns';
import { useDateTimeFormat } from '@tamanu/ui-components';

import { MarHeader } from '../../../components/Medication/Mar/MarHeader';
import { MarTable } from '../../../components/Medication/Mar/MarTable';
import { Colors } from '../../../constants';
import { useEncounter } from '../../../contexts/Encounter';

const MarContainer = styled.div`
  border-bottom: 1px solid ${Colors.outline};
  border-right: 1px solid ${Colors.outline};
`;

const toDate = (dateTimeString) => new Date(dateTimeString.replace(' ', 'T'));

const useFacilityDate = () => {
  const { encounter } = useEncounter();
  const { getFacilityCurrentDateTimeString } = useDateTimeFormat();
  const getFacilityNowRef = useRef(getFacilityCurrentDateTimeString);
  getFacilityNowRef.current = getFacilityCurrentDateTimeString;

  const [selectedDate, setSelectedDate] = useState(() => {
    const facilityNow = toDate(getFacilityCurrentDateTimeString());
    const encounterEnd = new Date(encounter?.endDate);
    return encounterEnd < facilityNow ? encounterEnd : facilityNow;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = toDate(getFacilityNowRef.current());
      setSelectedDate(prev => set(prev, { hours: now.getHours(), minutes: now.getMinutes() }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return [selectedDate, setSelectedDate];
};

export const MarView = () => {
  const [selectedDate, setSelectedDate] = useFacilityDate();

  return (
    <MarContainer>
      <MarHeader selectedDate={selectedDate} onDateChange={setSelectedDate} />
      <MarTable selectedDate={selectedDate} />
    </MarContainer>
  );
};
