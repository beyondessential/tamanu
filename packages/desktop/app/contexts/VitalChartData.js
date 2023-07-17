import React, { useState, useContext } from 'react';
import { addDays, format } from 'date-fns';

import { DATE_TIME_FORMAT } from '../components/Charts/components/DateTimeSelector';
import { useVisualisationConfigsQuery } from '../api/queries/useVisualisationConfigsQuery';

export const VitalChartDataContext = React.createContext({
  visualisationConfigs: [],
  vitalChartModalOpen: false,
  setVitalChartModalOpen: () => {},
  setChartKeys: () => {},
  chartKeys: ['vital-chart'],
  modalTitle: 'Vital Chart',
  setModalTitle: () => {},
  setDateRange: () => {},
  dateRange: ['', ''],
  isInMultiChartsView: false,
});

export const useVitalChartData = () => useContext(VitalChartDataContext);

export const VitalChartDataProvider = ({ children }) => {
  const [chartKeys, setChartKeys] = useState([]);
  const [modalTitle, setModalTitle] = useState(null);
  const [dateRange, setDateRange] = useState([
    format(addDays(new Date(), -1), DATE_TIME_FORMAT),
    format(new Date(), DATE_TIME_FORMAT),
  ]);
  const [vitalChartModalOpen, setVitalChartModalOpen] = useState(false);
  const { data: visualisationConfigs } = useVisualisationConfigsQuery();

  return (
    <VitalChartDataContext.Provider
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
        isInMultiChartsView: chartKeys.length > 1,
      }}
    >
      {children}
    </VitalChartDataContext.Provider>
  );
};
