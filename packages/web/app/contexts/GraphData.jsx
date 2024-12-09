import React, { useState } from 'react';
import { addDays, format } from 'date-fns';
import { DATE_TIME_FORMAT } from '../components/Charts/components/DateTimeSelector';

export const GraphDataProviderFactory = ({ visualisationConfigQueryFn, Context, children }) => {
  const [chartKeys, setChartKeys] = useState([]);
  const [isInMultiChartsView, setIsInMultiChartsView] = useState(false);
  const [modalTitle, setModalTitle] = useState(null);
  const [dateRange, setDateRange] = useState([
    format(addDays(new Date(), -1), DATE_TIME_FORMAT),
    format(new Date(), DATE_TIME_FORMAT),
  ]);
  const [vitalChartModalOpen, setVitalChartModalOpen] = useState(false);
  const { data } = visualisationConfigQueryFn();
  const { visualisationConfigs } = data;

  return (
    <Context.Provider
      value={{
        visualisationConfigs,
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
      }}
    >
      {children}
    </Context.Provider>
  );
};
