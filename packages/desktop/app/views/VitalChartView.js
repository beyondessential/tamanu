import React from 'react';
import { useVitalChartData } from '../contexts/VitalChartData';
import { LineChart } from '../components/Charts/LineChart';

export const VitalChartView = props => {
  const { chartKey } = props;
  const { chartData, visualisationConfigs, startDate, endDate, isLoading } = useVitalChartData();

  const visualisationConfig = visualisationConfigs.find(config => config.key === chartKey);

  return (
    <>
      <LineChart
        chartData={chartData}
        visualisationConfig={visualisationConfig}
        startDate={startDate}
        endDate={endDate}
        isLoading={isLoading}
      />
    </>
  );
};
