import React, { useState, useContext } from 'react';
import { addDays, format } from 'date-fns';

import { DATE_TIME_FORMAT } from '../components/Charts/components/DateTimeSelector';
import { useVitalsSurvey } from '../api/queries/useVitalsSurvey';

export const VitalChartDataContext = React.createContext({
  visualisationConfigs: [],
  vitalChartModalOpen: false,
  setVitalChartModalOpen: () => {},
  setChartKeys: () => {},
  chartKeys: ['vital-chart'],
  modalTitle: 'Vital Chart',
  setModalTitle: () => {},
  setStartDate: () => {},
  setEndDate: () => {},
  startDate: '',
  endDate: '',
});

export const useVitalChartData = () => useContext(VitalChartDataContext);

export const VitalChartDataProvider = ({ children }) => {
  const [chartKeys, setChartKeys] = useState([]);
  const [modalTitle, setModalTitle] = useState(null);
  const [startDate, setStartDate] = useState(format(addDays(new Date(), -1), DATE_TIME_FORMAT));
  const [endDate, setEndDate] = useState(format(new Date(), DATE_TIME_FORMAT));
  const [vitalChartModalOpen, setVitalChartModalOpen] = useState(false);

  const { encounter } = useEncounter();
  const { visualisationConfigs } = useVitalsSurvey();
  const { data: chartData, isLoading } = useVitalQuery(encounter.id, chartKey, startDate, endDate);

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
        setStartDate,
        setEndDate,
        startDate,
        endDate,
      }}
    >
      {children}
    </VitalChartDataContext.Provider>
  );
};
