import { set } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';

import { useDateTime } from '@tamanu/ui-components';
import { MarHeader } from '../../../components/Medication/Mar/MarHeader';
import { MarTable } from '../../../components/Medication/Mar/MarTable';
import { useEncounter } from '../../../contexts/Encounter';

const useFacilityDate = () => {
  const { encounter } = useEncounter();
  const { getFacilityNowDate, toFacilityDateTime } = useDateTime();
  const getFacilityNowDateRef = useRef(getFacilityNowDate);
  getFacilityNowDateRef.current = getFacilityNowDate;

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
      const now = getFacilityNowDateRef.current();
      setSelectedDate(prev => set(prev, { hours: now.getHours(), minutes: now.getMinutes() }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return [selectedDate, setSelectedDate];
};

export const MarView = () => {
  const [selectedDate, setSelectedDate] = useFacilityDate();

  return (
    <div>
      <MarHeader selectedDate={selectedDate} onDateChange={setSelectedDate} />
      <MarTable selectedDate={selectedDate} />
    </div>
  );
};
