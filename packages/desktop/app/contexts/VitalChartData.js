import React, { useState, useContext, useEffect } from 'react';
import { getChartDataFromVitalData } from '../utils/getChartDataFromVitalData';
import { useEncounter } from './Encounter';
import { useVitals } from '../api/queries/useVitals';

export const VitalChartDataContext = React.createContext({
  chartData: { data: [], yAxisConfigs: {} },
  setChartData: () => {},
  vitalChartModalOpen: false,
  setVitalChartModalOpen: () => {},
  chartKey: 'Vital Chart',
  setChartKey: () => {},
  setStartDate: () => {},
  setEndDate: () => {},
});

export const useVitalChartData = () => useContext(VitalChartDataContext);

export const VitalChartDataProvider = ({ children }) => {
  const [chartData, setChartData] = useState({ data: [], yAxisConfigs: {} });
  const [chartKey, setChartKey] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [vitalChartModalOpen, setVitalChartModalOpen] = useState(false);
  const { encounter } = useEncounter();

  const { data } = useVitals(encounter.id, startDate, endDate);
  const dataString = JSON.stringify(data);

  useEffect(() => {
    const dataArray = JSON.parse(dataString);
    const newRawChartData = dataArray.find(d => d.value === chartKey);
    const { chartData: newChartData, yAxisConfigs } = getChartDataFromVitalData(
      newRawChartData,
      chartKey,
    );
    setChartData({ data: newChartData, yAxisConfigs });
  }, [chartKey, startDate, endDate, dataString]);

  return (
    <VitalChartDataContext.Provider
      value={{
        chartData,
        setChartData,
        vitalChartModalOpen,
        setVitalChartModalOpen,
        chartKey,
        setChartKey,
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
