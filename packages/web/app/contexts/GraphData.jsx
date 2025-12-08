import React, { useState, useMemo } from 'react';
import { addDays, format } from 'date-fns';
import { DATE_TIME_FORMAT } from '../components/Charts/components/DateTimeSelector';

export const GraphDataProviderFactory = ({
  visualisationConfigQueryFn,
  visualisationConfigQueryArgs = [],
  Context,
  isVital = false,
  children,
}) => {
  const [chartKeys, setChartKeys] = useState([]);
  const [isInMultiChartsView, setIsInMultiChartsView] = useState(false);
  const [modalTitle, setModalTitle] = useState(null);
  const [dateRange, setDateRange] = useState([
    format(addDays(new Date(), -1), DATE_TIME_FORMAT),
    format(new Date(), DATE_TIME_FORMAT),
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
