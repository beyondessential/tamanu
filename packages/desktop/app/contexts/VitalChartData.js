import React, { useState, useContext, useEffect } from 'react';
import { addDays, format } from 'date-fns';
import { useEncounter } from './Encounter';
import { useVitalQuery } from '../api/queries/useVitalQuery';
import { DATE_TIME_FORMAT } from '../components/Charts/components/DateTimeSelector';
import { useVitalsSurvey } from '../api/queries/useVitalsSurvey';

export const VitalChartDataContext = React.createContext({
  chartData: [],
  visualisationConfig: {},
  visualisationConfigs: [],
  vitalChartModalOpen: false,
  setVitalChartModalOpen: () => {},
  chartKey: 'vital-chart',
  modalTitle: 'Vital Chart',
  setModalTitle: () => {},
  setChartKey: () => {},
  setStartDate: () => {},
  setEndDate: () => {},
});

export const useVitalChartData = () => useContext(VitalChartDataContext);

export const VitalChartDataProvider = ({ children }) => {
  const [chartKey, setChartKey] = useState(null);
  const [modalTitle, setModalTitle] = useState(null);
  const [startDate, setStartDate] = useState(format(addDays(new Date(), -1), DATE_TIME_FORMAT));
  const [endDate, setEndDate] = useState(format(new Date(), DATE_TIME_FORMAT));
  const [vitalChartModalOpen, setVitalChartModalOpen] = useState(false);
  const [visualisationConfig, setVisualisationConfig] = useState({});

  const { encounter } = useEncounter();
  const { visualisationConfigs } = useVitalsSurvey();
  const { data: chartData } = useVitalQuery(encounter.id, chartKey, startDate, endDate);

  useEffect(() => {
    const newVisualisationConfig = visualisationConfigs.find(k => k.key === chartKey);
    setVisualisationConfig(newVisualisationConfig);
  }, [chartKey, visualisationConfigs]);

  return (
    <VitalChartDataContext.Provider
      value={{
        chartData,
        visualisationConfigs,
        visualisationConfig,
        vitalChartModalOpen,
        setVitalChartModalOpen,
        chartKey,
        setChartKey,
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
