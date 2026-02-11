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

const useFacilityDate = () => {
  const { encounter } = useEncounter();
  const { getFacilityNow, toFacilityDateTime } = useDateTimeFormat();
  const getFacilityNowDate = () => new Date(getFacilityNow());
  const getFacilityNowRef = useRef(getFacilityNowDate);
  getFacilityNowRef.current = getFacilityNowDate;

  const toFacilityDate = dateStr => {
    if (!dateStr) return null;
    const converted = toFacilityDateTime(dateStr);
    return converted ? new Date(converted) : null;
  };

  const [selectedDate, setSelectedDate] = useState(() => {
    const facilityNow = getFacilityNowDate();
    const encounterEnd = toFacilityDate(encounter?.endDate);
    return encounterEnd && encounterEnd < facilityNow ? encounterEnd : facilityNow;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = getFacilityNowRef.current();
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
