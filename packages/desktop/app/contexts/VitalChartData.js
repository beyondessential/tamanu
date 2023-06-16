import React, { useState, useContext, useEffect } from 'react';
import { getChartDataFromVitalData } from '../utils/getChartDataFromVitalData';
import { useEncounter } from './Encounter';
import { useVitals } from '../api/queries/useVitals';

export const VitalChartDataContext = React.createContext({
  measureData: { data: [], yAxisConfigs: {} },
  setMeasureData: () => {},
  vitalChartModalOpen: false,
  setVitalChartModalOpen: () => {},
  chartKey: 'Vital Chart',
  setChartKey: () => {},
  setStartDate: () => {},
  setEndDate: () => {},
});

export const useVitalChartData = () => useContext(VitalChartDataContext);

export const VitalChartDataProvider = ({ children }) => {
  const [measureData, setMeasureData] = useState({ data: [], yAxisConfigs: {} });
  const [chartKey, setChartKey] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [vitalChartModalOpen, setVitalChartModalOpen] = useState(false);
  const { encounter } = useEncounter();

  const { data, recordedDates, error, isLoading } = useVitals(encounter.id, startDate, endDate);

  useEffect(() => {
    const newMeasureData = data.find(d => d.value === chartKey);
    if (newMeasureData) {
      const { chartData, yAxisConfigs } = getChartDataFromVitalData(newMeasureData);
      setMeasureData({ data: chartData, yAxisConfigs });
    } else {
      // TODO: handle empty data
      setMeasureData({
        data: [],
        yAxisConfigs: {
          graphRange: {
            min: 0,
            max: 20,
          },
          normalRange: {
            min: 0,
            max: 20,
          },
          interval: 2,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartKey, encounter.id, startDate, endDate]);

  return (
    <VitalChartDataContext.Provider
      value={{
        measureData,
        setMeasureData,
        vitalChartModalOpen,
        setVitalChartModalOpen,
        chartKey,
        setChartKey,
        setStartDate,
        setEndDate,
      }}
    >
      {children}
    </VitalChartDataContext.Provider>
  );
};
