import React, { useState, useMemo } from 'react';
import { addDays, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useDateTimeFormat } from '@tamanu/ui-components';

export const GraphDataProviderFactory = ({
  visualisationConfigQueryFn,
  visualisationConfigQueryArgs = [],
  Context,
  isVital = false,
  children,
}) => {
  const { getFacilityCurrentDateTimeString, facilityTimeZone, countryTimeZone } = useDateTimeFormat();
  const [chartKeys, setChartKeys] = useState([]);
  const [isInMultiChartsView, setIsInMultiChartsView] = useState(false);
  const [modalTitle, setModalTitle] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    const endDateStr = getFacilityCurrentDateTimeString();
    const endDate = parseISO(endDateStr);
    const startDate = addDays(endDate, -1);
    const tz = facilityTimeZone ?? countryTimeZone;
    const startDateStr = formatInTimeZone(startDate, tz, 'yyyy-MM-dd HH:mm:ss');
    return [startDateStr, endDateStr];
  });
  const [vitalChartModalOpen, setVitalChartModalOpen] = useState(false);
  const { data } = visualisationConfigQueryFn(...visualisationConfigQueryArgs);
  const { visualisationConfigs, allGraphedChartKeys } = data;

  const contextValue = useMemo(() => ({
    isVital,
    visualisationConfigs,
    allGraphedChartKeys,
    vitalChartModalOpen,
    setVitalChartModalOpen,
    chartKeys,
    setChartKeys,
    modalTitle,
    setModalTitle,
    dateRange,
    setDateRange,
    isInMultiChartsView,
    setIsInMultiChartsView,
  }), [
    isVital,
    visualisationConfigs,
    allGraphedChartKeys,
    vitalChartModalOpen,
    setVitalChartModalOpen,
    chartKeys,
    setChartKeys,
    modalTitle,
    setModalTitle,
    dateRange,
    setDateRange,
    isInMultiChartsView,
    setIsInMultiChartsView,
  ]);

  return (
    <Context.Provider value={contextValue}>
      {children}
    </Context.Provider>
  );
};
