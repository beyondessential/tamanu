import React, { useState, useContext } from 'react';
import { getChartDataFromVitalData } from '../utils/getChartDataFromVitalData';
import { useEncounter } from './Encounter';
import { useVitals } from '../api/queries/useVitals';

export const VitalChartDataContext = React.createContext({
  chartData: [],
  visualisationConfig: {},
  visualisationConfigs: {},
  vitalChartModalOpen: false,
  setVitalChartModalOpen: () => {},
  chartKey: 'Vital Chart',
  setChartKey: () => {},
  setStartDate: () => {},
  setEndDate: () => {},
});

export const useVitalChartData = () => useContext(VitalChartDataContext);

const visualisationConfigs = {
  'Temperature (°C)': {
    yAxis: {
      graphRange: {
        min: 33,
        max: 41,
      },
      normalRange: { min: 35, max: 39 },
      interval: 1,
    },
  },
  'Heart Rate (BPM)': {
    yAxis: {
      graphRange: {
        min: 20,
        max: 180,
      },
      normalRange: { min: 40, max: 130 },
      interval: 10,
    },
  },
  'Respiratory Rate (BPM)': {
    yAxis: {
      graphRange: {
        min: 0,
        max: 40,
      },
      normalRange: { min: 5, max: 30 },
      interval: 5,
    },
  },
  'SPO2 (%)': {
    yAxis: {
      graphRange: {
        min: 80,
        max: 100,
      },
      normalRange: { min: 85, max: 100 },
      interval: 5,
    },
  },
};
let visualisationConfig = {};

export const VitalChartDataProvider = ({ children }) => {
  const [chartKey, setChartKey] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [vitalChartModalOpen, setVitalChartModalOpen] = useState(false);

  const { encounter } = useEncounter();
  const { data: vitalsData, isLoading: isVitalLoading } = useVitals(
    encounter.id,
    startDate,
    endDate,
  );

  let chartData = [];

  if (!isVitalLoading && chartKey && vitalsData) {
    const newRawChartData = vitalsData.find(d => d.value === chartKey) || {};
    chartData = getChartDataFromVitalData(newRawChartData);
    visualisationConfig = visualisationConfigs[chartKey];
  }

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
