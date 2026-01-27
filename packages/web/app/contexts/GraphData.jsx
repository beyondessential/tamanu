import React, { useState, useMemo } from 'react';
import { addDays, parseISO } from 'date-fns';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { useDateTimeFormat } from '@tamanu/ui-components';

export const GraphDataProviderFactory = ({
  visualisationConfigQueryFn,
  visualisationConfigQueryArgs = [],
  Context,
  isVital = false,
  children,
}) => {
  const { getFacilityCurrentDateTimeString } = useDateTimeFormat();
  const [chartKeys, setChartKeys] = useState([]);
  const [isInMultiChartsView, setIsInMultiChartsView] = useState(false);
  const [modalTitle, setModalTitle] = useState(null);
  const [dateRange, setDateRange] = useState(() => [
    toDateTimeString(addDays(parseISO(getFacilityCurrentDateTimeString()), -1)),
    getFacilityCurrentDateTimeString(),
  ]);
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
