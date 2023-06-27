import React from 'react';
import { useVitalChartData } from '../../contexts/VitalChartData';
import { LineChart } from '../../components/Charts/LineChart';
import { useEncounter } from '../../contexts/Encounter';
import { useVitalQuery } from '../../api/queries/useVitalQuery';

// Fetching and preparing data for vital chart
export const VitalChartView = () => {
  const { chartKeys, visualisationConfigs, startDate, endDate } = useVitalChartData();
  const chartKey = chartKeys[0];
  const { encounter } = useEncounter();
  const { data: vitalData, isLoading } = useVitalQuery(encounter.id, chartKey, startDate, endDate);

  const chartData = vitalData.map(({ recordedDate, body }) => ({
    name: recordedDate,
    value: body,
  }));
  const visualisationConfig = visualisationConfigs.find(config => config.key === chartKey);

  return (
    <LineChart
      chartData={chartData}
      visualisationConfig={visualisationConfig}
      startDate={startDate}
      endDate={endDate}
      isLoading={isLoading}
    />
  );
};
